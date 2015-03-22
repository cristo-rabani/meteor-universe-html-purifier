Universe HTML Purifier
=========================
> This package is part of Universe, a framework based on [Meteor platform](http://meteor.com)
maintained by [Vazco](http://www.vazco.eu).

> It works as standalone Meteor package, but you can get max out of it when using the whole system.

Universe HTML Purifier provides a method to cleanup dirty html. It will take a string of dirty and badly formatted html, and return a pretty printed valid HTML string.
We can configure behavior of purifying, like changes available attributes and additional tags (not implemented yet)
The script can work on both sides (client/server). This package is suggested to use with content editable, rich editor or there where the html must be taken from untrusted sources.

The purifying is based on the [HTML5 specification](http://www.whatwg.org/specs/web-apps/current-work/#parsing), and implements a subset of the algorithm described there.
Only a limited set of the permitted HTML5 elements and attributes are permitted, and all other tags/attributes will simply be gone in the resulting HTML.


# Basic usage

```javascript
UniHTML.purify('<p><b>Some</b> Text</p>');
```


## Default allowed elements
* b
* i
* strong
* em
* blockquote
* ol
* ul
* li
* p
* pre
* a
* img
* br
* table
* caption
* col
* colgroup
* tbody
* td
* tfoot
* th
* thead
* tr

All other elements will be stripped from the resulting HTML, although the inner text will be left intact.
The script can be use with a Rich Text Editor, and purposefully puts very firm limits on what can be included in the resulting XHTML. Since it is based on the HTML5 parsing specification it is very robust when it comes to cleaning up tag soup.

## Default allowed attributes

* all_elements: ['class', 'style', 'id']
* a: ['href', 'target', 'title', 'name', 'rel', 'rev', 'type']
* blockquote: ['cite']
* img: ['src', 'alt', 'title', 'longdesc']
* td: ['colspan']
* th: ['colspan']
* tr: ['rowspan']
* table: ['border']

You can change allowed attributes for all or one allowed tag, by

```
UniHTML.setNewAllowedAttributes(attributesArray, tag);
```

default value of tag parameter is 'all_elements'


## License

Author: Krzysztof Różalski (Cristo Rabani)
Released under Apache Software License 2.0


Includes John Resig’s and Erik Arvidsson’s HTML Parser, which is modificated to support html5 and It used as a tokenizer.
Released under triple licensed using Apache Software License 2.0, Mozilla Public License or GNU Public License
http://erik.eae.net/simplehtmlparser/simplehtmlparser.js

Written based on the wonderful:
- node-xhtml-purifier, which is copyright © 2014 [Charlie Stigler](http://charliestigler.com) with [Zaption](http://www.zaption.com) and released under the MIT license.
- javascript-xhtml-purifier, which is copyright © 2008 [Mathias Biilmann Christensen](http://mathias-biilmann.net) / [Domestika INTERNET S.L.](http://domestika.com), released under the MIT license


