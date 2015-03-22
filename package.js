Package.describe({
    summary: 'Package to cleaning up HTML from unknown/untrusted tags. It can help you in protection against XSS',
    name: 'vazco:universe-html-purifier',
    version: '1.0.0'
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