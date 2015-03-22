Package.describe({
    summary: 'Package to cleaning up HTML from unknown/untrusted tags. It can help you in protection against XSS',
    name: 'vazco:universe-html-purifier',
    version: '1.0.1',
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