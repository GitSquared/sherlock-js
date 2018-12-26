# Sherlock.js

This is a "remake" of the original [sherlock](https://github.com/sdushantha/sherlock) written in Python by [sdushantha](https://github.com/sdushantha) that I made mostly because I was bored and found that it had some flaws.

It is written in Node.js simply because that's the language I'm the most confortable with, but that's probably not the best choice and I'll see if I can make a Rust version or something.

Notable differences compared to `sherlock` (at time of writing):

 - Tests all services concurrently (asynchronous/"multithreaded")
 - Checks whether accounts exists by looking at the HTTP response status code (instead of HTML parsing)
 - Follows HTTP(S) redirections
 - Command line switches allow usage in an external script

### Available command line switches
 - `--help`: Display CLI switches & a link to the GitHub repo
 - `--version` or `-v`: Print version
 - `--name user` or `-n user`: Specify a username to search for (remove interactive prompt)
 - `--batch` or `-b`: Output results in raw minified JSON
 - `--output file.txt` or `-o file.txt`: Print minified JSON results in a file
