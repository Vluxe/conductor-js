# conductor-js
Conductor client library in javascript.

## Example

serve the example html file with a web server and point the server to the example conductor server. If done correctly you should see them message back and forth in realtime. More to come...

## Building

Using browserify, the contents of the /src directory can be exported to standard ES5 javascript.

```shell
browserify src/conductor.js -t /usr/local/lib/node_modules/babelify -t /usr/local/lib/node_modules/uglifyify --outfile conductor.min.js
```

If browserify and the support modules are install, do this:

```
npm install -g browserify
npm install -g babel
npm install -g babelify
npm install -g uglifyify
```

## License

Conductor is licensed under the Apache v2 License.

## Contact

### Vluxe
* https://github.com/Vluxe
* https://twitter.com/vluxeio
* http://vluxe.io

### Dalton Cherry
* https://github.com/daltoniam
* http://twitter.com/daltoniam
* http://daltoniam.com