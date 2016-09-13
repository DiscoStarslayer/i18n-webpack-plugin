# MessageFormat Plugin for Webpack
Statically compile ICU Message strings into your bundle

## Usage
Add to your plugins in the webpack config
```javascript
var MessageFormatPlugin = require("messageformat-webpack-plugin");
var languages = {
	en: { hello: 'Hello, {name}!' }
}

{
	plugins: [
		new MessageFormatPlugin('en', languages)
	]
}
```

Now you can statically compile ICU Message strings into your project like so:

```javascript
console.log(__('hello', { name: 'world' })) // 'Hello, world!'
```

Since this is done at compile time, it is not able to handle variables, only literals.
See [Yahoo Intl-MessageFormat](https://github.com/yahoo/intl-messageformat) for more usage examples.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)