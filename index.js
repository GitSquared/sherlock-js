(async function () {
	const {log} = console;
	const arg = require('arg');
	const path = require('path');
	const readline = require('readline');
	const chalk = require('chalk');
	const {fork} = require('child_process');

	const services = require(path.join(__dirname, 'services.json'));

	function errorAndDie(err) {
		log(chalk.red.bold(`[!] Fatal error: ${err.message || err}`));
		process.exit(1);
	}

	process.on('uncaughtException', errorAndDie);
	process.on('unhandledRejection', errorAndDie);

	const args = arg({
		'--help': Boolean,
		'--version': Boolean,
		'--name': String,
		'--only-found': Boolean,
		'--json': Boolean,
		'--csv': Boolean,
		'--pretty-json': Boolean,

		'-v': '--version',
		'-n': '--name',
		'-f': '--only-found',
		'-j': '--json',
		'-c': '--csv'
	});

	process.on('beforeExit', code => {
		if (code === 0 && args['--json'] && global.finalResults) {
			log(JSON.stringify(global.finalResults));
		}

		if (code === 0 && args['--pretty-json'] && global.finalResults) {
			log(JSON.stringify(global.finalResults, '', 2));
		}

		if (code === 0 && args['--csv'] && global.finalResults) {
			log('Website,Account');
			Object.keys(global.finalResults).forEach(site => {
				log(`"${site}",${global.finalResults[site]}`);
			});
		}
	});

	if (args['--version']) {
		log('Sherlock.js v2.0.0');
		log(`Bundled list: ${Object.keys(services).length} account providers.`);
		process.exit(0);
	}

	if (args['--help']) {
		log(chalk`
{bold Sherlock.js} - Search for usernames across online services.

Run without any arguments to show an interactive prompt and pretty-print
results as soon as they are found.

{underline Available command line switches:}
  General:
    {yellow.italic --help}:                  Display this message
    {yellow.italic --version} or {yellow.italic -v}:         Print version
  Options:
    {yellow.italic --name} {blue.bold user} or {yellow.italic -n} {blue.bold user}:  Specify a username to search for (remove prompt)
    {yellow.italic --only-found} or {yellow.italic -f}:      Only output when username was found (skip errors/404s)
  Output formats:
    {yellow.italic --json} or {yellow.italic -j}:            Output results in minified JSON
    {yellow.italic --csv} or {yellow.italic -c}:             Output results in CSV format
    {yellow.italic --pretty-json}:           Output results in whitespaced JSON

{underline Examples:}
  Search for all accounts named Smith, display live results:
    {bold ./sherlockjs} {yellow.italic --name} {blue.bold Smith}
  Get a human-readable file with links to all accounts named Smith:
    {bold ./sherlockjs} {yellow.italic --pretty-json --only-found -n} {blue.bold Smith} {green >} {blue.bold smith_accounts.json}

You can use sherlockjs non-interactive options combined with common shell utilities to
easily batch-process lists of users, and leverage sherlockjs' multithreaded design to
create powerful, fast, extensive one-liner searches.

For instance, to batch-process a list of usernames, output each user's accounts in
separate .csv files, and start all sherlockjs searches simultaneously (careful with
the potential # of threads!):
    {bold cat} {blue.bold users.txt} {green.bold |} {bold xargs} {yellow.italic -r -P} {blue.bold 0} {yellow.italic -I} {blue.bold %} {bold sh} {yellow.italic -c} {magenta "}{bold ./sherlockjs} {yellow.italic -cf -n} {blue.bold %} {green >} {blue.bold accounts_%.csv}{magenta "}

The list of account providers used by sherlockjs is bundled and does not auto-update.
Check the repo link mentioned below for updates.

{italic More on GitHub: {blue https://github.com/GitSquared/sherlock-js}}`);
		process.exit(0);
	}

	global.liveOutput = !((args['--json'] || args['--pretty-json'] || args['--csv']));

	if (args['--name']) {
		scan(args['--name']);
	} else {
		prompt().then(scan);
	}

	async function prompt() {
		log(chalk.bold(`
                                                          ."""-.
                                                         /      \\
 ____  _               _            _                    |  _..--'-.
/ ___|| |__   ___ _ __| | ___   ___| |__                >.\`__.-""\\;"\`
\\___ \\| '_ \\ / _ \\ '__| |/ _ \\ / __| |/ /      _        / /(     ^\\
 ___) | | | |  __/ |  | | (_) | (__|   <   _  |_|___    '-\`)     =|-.
|____/|_| |_|\\___|_|  |_|\\___/ \\___|_|\\_\\ |_| | |_ -|   /\`--.'--'   \\ .-.
                                             _| |___| .'\`-._ \`.\\    | J /
                                            |___|    /      \`--.|   \\__/
        `));

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		let name = await new Promise((resolve, reject) => {
			try {
				rl.question(chalk.green.bold('[>] Input username: '), answer => {
					rl.close();
					log('');

					resolve(answer);
				});
			} catch (error) {
				reject(error);
			}
		});

		name = name.trim();

		if (name.match(/^[^ /&?]+$/g)) {
			return name;
		}

		throw new Error('Name contains unauthorised characters. Cannot proceed.');
	}

	async function scan(name) {
		global.finalResults = {};
		const results = new Proxy(global.finalResults, {
			set: (target, prop, value) => {
				switch (value) {
					case 'Checking...':
						// Log(chalk.bold("[")+chalk.bold.yellow("*")+chalk.bold("]")+" "+chalk.bold.green(prop+": ")+chalk.dim(value));
						break;
					case 'Not Found!':
						if (global.liveOutput && !args['--only-found']) {
							log(chalk.bold('[') + chalk.bold.red('-') + chalk.bold(']') + ' ' + chalk.bold.green(prop + ': ') + chalk.bold.yellow(value));
						}

						break;
					case 'Error':
						if (global.liveOutput && !args['--only-found']) {
							log(chalk.bold('[') + chalk.bold.red('X') + chalk.bold(']') + ' ' + chalk.bold.red(prop + ': ') + chalk.bold.red(value));
						}

						break;
					default:
						if (global.liveOutput) {
							log(chalk.bold('[') + chalk.bold.green('+') + chalk.bold(']') + ' ' + chalk.bold.green(prop + ': ') + value);
						}

						if (args['--only-found']) {
							target[prop] = value;
						}
				}

				if (!args['--only-found']) {
					target[prop] = value;
				}
			},
			get: (target, prop) => {
				return target[prop];
			}
		});

		Object.keys(services).forEach(key => {
			const url = services[key].replace('{}', name);

			results[key] = 'Checking...';

			const worker = fork(path.join(__dirname, 'https-worker.js'));
			worker.on('message', r => {
				if (typeof r === 'boolean') {
					results[key] = r ? url : 'Not Found!';
				} else {
					results[key] = 'Error';
				}
			});
			worker.send(url + ' ' + name);
		});
	}
})();
