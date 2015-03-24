Package.describe({
    summary: 'Package to sanitize HTML from unknown/untrusted tags. It can help you in protection against XSS. Additionally It provides simple HTML5 parser',
    name: 'vazco:universe-html-purifier',
    version: '1.0.3',
    git: 'https://github.com/cristo-rabani/meteor-universe-html-purifier.git'
});

Package.on_use(function (api) {
    api.add_files([
        'HTMLParser.js',
        'HTMLPurifier.js'
    ]);
    api.export([
        'UniHTML'
    ]);
});