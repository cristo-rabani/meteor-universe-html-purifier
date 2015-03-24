Universe HTML Purifier
=========================
> This package is part of Universe, a framework based on [Meteor platform](http://meteor.com)
maintained by [Vazco](http://www.vazco.eu).

> It works as standalone Meteor package, but you can get max out of it when using the whole system.

Universe HTML Purifier provides a method to cleanup dirty html and it can help you in protection against cross site scripting (XSS) attacks.
It will take a string of dirty and badly formatted html, and return a pretty printed valid HTML string.
We can configure behavior of purifying, such as: changes available attributes, additional allowed tags, formatting and transforming.
The script can work on both sides (client/server). This package is suggested to use with content editable, rich editor or everywhere where the html must be taken from untrusted sources.

The purifying is based on the [HTML5 specification](http://www.whatwg.org/specs/web-apps/current-work/#parsing), and implements a subset of the algorithm described there.
Only a limited set of the permitted HTML5 elements and attributes are permitted, and all other tags/attributes will simply be gone in the resulting HTML.

Additionally package provides html parser.

# Usage

## Basic

```javascript
UniHTML.purify('<p><b>Some</b> Text</p>');
```
## Customize purifying

Additionally you can pass settings as a second parameter of method `UniHTML.purify`:

- noFormatting - deactivation of pretty formatting
- preferStrong_Em - transform tags: `<b>` to `<strong>`, `<i>` to `<em>`
- preferB_I - transform tags: `<strong>` to `<b>`, `<em>` to `<i>`
- noHeaders - transform heading tags to `<p><strong>` (if preferB_I === true then will be `<b>` instead `<strong>`)
- withoutTags - An array of skipped tags, (which were before added, including defaults).

Warning: Parameter 'withoutTags' works only for global tags.
You cannot skipped local table tags like example: `<tr>`, `<caption>`, `<td>`

## Default allowed elements
- b
- i
- strong
- em
- blockquote
- ol
- ul
- li
- h1-h7
- p
- span
- pre
- a
- u
- img
- br
- table
  + caption
  + col
  + colgroup
  + tbody
  + td
  + tfoot
  + th
  + thead
  + tr

All not allowed elements will be stripped from the resulting HTML, although the inner text will be left intact.
You can add additional tags using method `UniHTML.addNewAllowedTag(tagName, isSelfClosing)`,
is very important to pass true as second argument if tag is self-closing.

You can also skipped default allowed tags for current call purify,
but only global tags (top level). It mean that you cannot skipped `<td>` or `<tr>` for `<table>`

## Default allowed attributes

- all_elements: ['class', 'style', 'id']
- a: ['href', 'target', 'title', 'name', 'rel', 'rev', 'type']
- blockquote: ['cite']
- img: ['src', 'alt', 'title', 'longdesc']
- td: ['colspan']
- th: ['colspan']
- tr: ['rowspan']
- table: ['border']

You can change allowed attributes for all or one allowed tag, by

```
UniHTML.setNewAllowedAttributes(attributesArray, tag);
```

default value of tag parameter is 'all_elements'

## Parser

Package provides simple html parser.
To use it, you can just call method:

```
UniHTML.parse(html_string, {
           // attributesOnTag is an Object like {name, value, escaped}
      start: function(tagName, attributesOnTag, isSelfClosing), // open tag
      end: function(tagName), // close
      chars: function(text), // text between open and closing tag
      comment: function(text) // text from comment
});
```

Parse html5 string (including custom tags) and calls callback in the same order as tags in html string are present.
( from root to leaf, and so on for each node)

## License

Author: Krzysztof Różalski (Cristo Rabani)
Released under Apache Software License 2.0


Includes John Resig’s and Erik Arvidsson’s HTML Parser, which is modificated to support html5 and It used as a tokenizer.
Released under triple licensed using Apache Software License 2.0, Mozilla Public License or GNU Public License
http://erik.eae.net/simplehtmlparser/simplehtmlparser.js

Written based on the wonderful:
- javascript-xhtml-purifier, which is copyright © 2008 [Mathias Biilmann Christensen](http://mathias-biilmann.net) / [Domestika INTERNET S.L.](http://domestika.com), released under the MIT license
and partly:
- node-xhtml-purifier, which is copyright © 2014 [Charlie Stigler](http://charliestigler.com) with [Zaption](http://www.zaption.com) and released under the MIT license.


