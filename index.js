(async function() {
    const log = console.log;
    const arg = require("arg");
    const readline = require("readline");
    const chalk = require("chalk");
    const {fork} = require("child_process");

    const services = require("./services.json");

    function errorAndDie(err) {
        log(chalk.red.bold(`[!] Fatal error: ${err.message || err}`));
        process.exit(1);
    }
    process.on("uncaughtException", errorAndDie);
    process.on("unhandledRejection", errorAndDie);

    const args = arg({
        '--help': Boolean,
        '--version': Boolean,
        '--name': String,
        '--batch': Boolean,
        '--output': String,

        '-v': '--version',
        '-n': '--name',
        '-b': '--batch',
        '-o': '--output'
    });

    process.on("beforeExit", (code) => {
        if (code === 0 && args["--batch"] && !args["--output"] && global.finalResults) log(JSON.stringify(global.finalResults));
        if (code === 0 && args["--output"] && global.finalResults) require("fs").writeFileSync(require("path").join(process.cwd(), args["--output"]), JSON.stringify(global.finalResults));
    });

    if (args["--version"]) {
        log("Sherlock.js v1.0.0");
        process.exit(0);
    }
    if (args["--help"]) {
        log(`
Available command line switches:
    --help: Display this message
    --version or -v: Print version
    --name user or -n user: Specify a username to search for (remove interactive prompt)
    --batch or -b: Output results in minified JSON
    --output res.json or -o res.json: Print minified JSON results in a file

Additional info available at https://github.com/GitSquared/sherlock-js
        `);
        process.exit(0);
    }

    if (args["--name"]) {
        scan(args["--name"]);
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
                rl.question(chalk.green.bold("[>] Input username: "), answer => {
                    rl.close();
                    log("");

                    resolve(answer);
                });
            } catch(e) { reject(e); }
        });

        name = name.trim();

        if (name.match(/^[^ /&?]+$/g)) {
            return name;
        } else {
            throw new Error("Name contains unauthorised characters. Cannot proceed.");
        }
    }

    async function scan(name) {
        global.finalResults = {};
        let results = new Proxy(global.finalResults, {
            set: (target, prop, value) => {
                switch(value) {
                    case "Checking...":
                        // log(chalk.bold("[")+chalk.bold.yellow("*")+chalk.bold("]")+" "+chalk.bold.green(prop+": ")+chalk.dim(value));
                        break;
                    case "Not Found!":
                        if (!args["--batch"]) log(chalk.bold("[")+chalk.bold.red("-")+chalk.bold("]")+" "+chalk.bold.green(prop+": ")+chalk.bold.yellow(value));
                        break;
                    case "Error":
                        if (!args["--batch"]) log(chalk.bold("[")+chalk.bold.red("X")+chalk.bold("]")+" "+chalk.bold.red(prop+": ")+chalk.bold.red(value));
                        break;
                    default:
                        if (!args["--batch"]) log(chalk.bold("[")+chalk.bold.green("+")+chalk.bold("]")+" "+chalk.bold.green(prop+": ")+value);
                }

                target[prop] = value;
            },
            get: (target, prop) => {
                return target[prop];
            }
        });

        Object.keys(services).forEach(key => {
            let url = services[key].replace("{}", name);

            results[key] = "Checking...";

            let worker = fork("./httpsWorker.js");
            worker.on("message", r => {
                if (typeof r === "boolean") {
                    results[key] = r ? url : "Not Found!";
                } else {
                    results[key] = "Error";
                }
            });
            worker.send(url+" "+name);
        });
    }
})();
