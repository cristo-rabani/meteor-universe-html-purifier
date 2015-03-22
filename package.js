Package.describe({
    summary: 'Package to cleaning up HTML from unknown/untrusted tags.',
    name: 'vazco:universe-html-purifier'
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