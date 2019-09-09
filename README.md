# Sherlock.js

<p align="center">
  <br>
  <img alt="Screenshot" src="https://github.com/GitSquared/sherlock-js/raw/master/screenshot.png" />
  <br><br>
</p>

This is a "remake" of the original [sherlock](https://github.com/sdushantha/sherlock) written in Python by [sdushantha](https://github.com/sdushantha) that I made mostly because I was bored and found that it had some flaws.

It is written in Node.js simply because that's the language I'm the most confortable with, but that's probably not the best choice and I'll see if I can make a Rust version or something.

Notable differences compared to `sherlock` (at time of writing):

 - [0 dependencies pre-built binaries for Windows/macOS/Linux](https://github.com/GitSquared/sherlock-js/releases)
 - Tests all services concurrently (asynchronous/"multithreaded")
 - Checks whether accounts exists by looking at both the HTTP response status code and stripping down the HTML code to search if the desired username is written on the page
 - Follows HTTP(S) redirections
 - Command line switches allow piping output in various formats; designed to be used with `xargs`

### Available command line switches
 - General:
   - --help:                  Display this message
   - --version or -v:         Print version
 - Options:
   - --name user or -n user:  Specify a username to search for (remove prompt)
   - --only-found or -f:      Only output when username was found (skip errors/404s)
 - Output formats:
   - --json or -j:            Output results in minified JSON
   - --csv or -c:             Output results in CSV format
   - --pretty-json:           Output results in whitespaced JSON

### Examples:
Search for all accounts named Smith, display live results:
```
./sherlockjs --name Smith
```

Get a human-readable file with links to all accounts named Smith:
```
./sherlockjs --pretty-json --only-found -n Smith > smith_accounts.json
```

You can use sherlockjs non-interactive options combined with common shell utilities to
easily batch-process lists of users, and leverage sherlockjs' multithreaded design to
create powerful, fast, extensive one-liner searches.

For instance, to batch-process a list of usernames, output each user's accounts in
separate .csv files, and start all sherlockjs searches simultaneously (careful with
the potential # of threads!):
```
cat users.txt | xargs -r -P 0 -I % sh -c "./sherlockjs -cf -n % > accounts_%.csv"
```
