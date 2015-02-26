'use strict';

var expect = require('chai').expect;
var stream = require('stream');
var through = require('through2');
var vfs = require('vinyl-fs');

var statici18n = require('../index');
var Translator = require('../lib/translator');
var TranslatedFile = require('../lib/translated-file');

var appPath = __dirname + '/fixtures/app';


describe('StaticI18n', function(){

  it('throws for null targets', function() {
    var target = null;
    var build = new statici18n.obj(target, {}, new stream());
    var checkNull = function() { build.checkTarget(target); };
    expect(checkNull).to.throw('Missing files');
  });

  it('blows up when fed an empty stream', function() {
    var emptyStream = new stream();
    var translatedStream = emptyStream.pipe(statici18n());
    var badStream = function() { translatedStream.write(); };
    expect(badStream).to.throw('Missing files');
  });

});


describe('Translator', function(){

  it('consumes translation catalogs', function() {
    var translator = new Translator({localeDir: appPath + '/locale'});
    var locales = translator.getLocales();
    expect(locales.length).to.equal(3);
  });

  it('translates "Hello World"', function() {
    var translator = new Translator({localeDir: appPath + '/locale'});
    var bonjour = 'Bonjour tout le monde';
    expect(translator.langGettext('fr', 'Hello World')).to.equal(bonjour);
  });

  it('is useable through a stream', function(done){
    var translator = new Translator({localeDir: appPath + '/locale'});
    var translate = translator.getStreamTranslator();
    var count = 0;

    var downStreamTransformer = through.obj(function(obj, enc, callback) {
      count += 1;
      this.resume();
      callback();
    });

    var assertSomeItemsWerePiped = function() {
      expect(count).to.not.equal(0);
      done();
    };

    vfs.src(appPath + '/src/*')
      .pipe(translate)
      .pipe(downStreamTransformer)
      .on('end', assertSomeItemsWerePiped);

  });

});


describe('Translated File', function() {

  describe('prefixing', function() {

    it('uses an empty string when the lang matches the default', function() {
      var prefix = TranslatedFile.getLangPrefix('same', 'same');
      expect(prefix).to.equal('');
    });

    it('creates lang prefixes from translation catalogs', function() {
      var ptPrefix = TranslatedFile.getLangPrefix('pt_BR');
      expect(ptPrefix).to.equal('pt-br/');
      var dePrefix = TranslatedFile.getLangPrefix('de-Latn_DE-1996');
      expect(dePrefix).to.equal('de-latn-de-1996/');
    });

  });

});
