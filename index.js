/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
	Edits Darren Thompson @DiscoStarslayer
*/

var ConstDependency = require("webpack/lib/dependencies/ConstDependency");
var NullFactory = require("webpack/lib/NullFactory");
var MissingLocalizationError = require("./MissingLocalizationError");
var IntlMessageFormat = require('intl-messageformat');

/**
 *
 * @param {string} locale Locale to translate to
 * @param {object} languages Object of all the supported languages, key being relevant locale
 * @param {object} options Options object
 * @constructor
 */
function MessageFormatPlugin(locale, languages, options) {
	this.options = options || {};

	this.locale = locale;
	this.messages = typeof languages[locale] === 'object' ? languages[locale] : {};

	this.functionName = this.options.functionName || "__";
	this.customFormats = this.options.customFormats;
	this.failOnMissing = !!this.options.failOnMissing;
}

module.exports = MessageFormatPlugin;

MessageFormatPlugin.prototype.apply = function(compiler) {
	var messages = this.messages,
		failOnMissing = this.failOnMissing,
		locale = this.locale,
		customFormats = this.customFormats;

	compiler.plugin("compilation", function(compilation, params) {
		compilation.dependencyFactories.set(ConstDependency, new NullFactory());
		compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
	});

	compiler.parser.plugin("call " + this.functionName, function(expr) {
		var key, values;

		switch (expr.arguments.length) {
			case 2:
				if (expr.arguments[1].type !== 'ObjectExpression') return;
				values = parseObject(this, expr.arguments[1]);

				key = this.evaluateExpression(expr.arguments[0]);
				if (!key.isString()) return;
				key = key.string;

				break;
			case 1:
				values = null;

				key = this.evaluateExpression(expr.arguments[0]);
				if (!key.isString()) return;
				key = key.string;

				break;
			default:
				return;
		}

		if (messages[key]) {
			var msg = new IntlMessageFormat(messages[key], locale, customFormats);
			var result = msg.format(values);
		} else {
			var error = this.state.module[__dirname];
			if (!error) {
				error = this.state.module[__dirname] = new MissingLocalizationError(this.state.module, key, values);
				if (failOnMissing) {
					this.state.module.errors.push(error);
				} else {
					this.state.module.warnings.push(error);
				}
			} else if (error.requests.indexOf(key) < 0) {
				error.add(key, values);
			}

			result = key;
		}

		var dep = new ConstDependency(JSON.stringify(result), expr.range);
		dep.loc = expr.loc;

		this.state.current.addDependency(dep);

		return true;
	});

};

/**
 *
 * @param {object} context Parser context
 * @param {object} objectAST Abstract syntax tree of a values object
 */
function parseObject(context, objectAST) {
	var object = {};

	objectAST.properties.forEach(function(prop) {
		var key = prop.key.name;
		var value = context.evaluateExpression(prop.value);

		if (value.isString()) {
			object[key] = value.string;
		} else if (value.isNumber()) {
			object[key] = value.number;
		}
	});

	return object;
}