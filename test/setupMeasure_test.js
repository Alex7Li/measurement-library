goog.module('measurementLibrary.measure.testing.setup');
goog.setTestOnly();

/**
 * Run a test, once assuming that the measure snippet fired before the call
 * to setup, then again assuming that the measure snippet fired after the call
 * to setup.
 * When the measurement library is added to a html page, it is loaded
 * asynchronously with a setup snippet. Hence, the two code blocks can
 * run in either order. This function ensures that the library has the same
 * behavior no matter which code is executed first.
 *
 * @param {function(!Array<*>):undefined} config The configuration
 *     to be done in the measure code snippet.
 * @param {function(!Array<*>):undefined} test The tests to run
 *     after both the code snippet and setupMeasure function have fired.
 */
function executeSnippetBeforeAndAfterSetup(config, test) {
  let snippet;
  let dataLayer;
  // Before each test, reset the data layer state, and create
  // a snippet function that emulates a user-defined measurement library
  // code snippet with options given by the code in the `config` variable.
  beforeEach(() => {
    // Reset the data layer we are using.
    dataLayer = [];
    // The code snippet that is run asynchronously.
    snippet = (dataLayer) => {
      const measure = function() {
        dataLayer.push(arguments);
      };
      config(measure);
    };
  });
  it('assuming the measure snippet ran first', () => {
    snippet(dataLayer);
    setupMeasure(dataLayer);
    test(dataLayer);
  });

  it('assuming the setupMeasure function ran first', () => {
    setupMeasure(dataLayer);
    snippet(dataLayer);
    test(dataLayer);
  });
}

describe('After calling the setupMeasure function of setup', () => {
  let load;
  let save;
  let persistTime;
  let processEvent;

  // Create a Mock Storage and Mock Processor object. Note that we cannot
  // use jasmine.createSpyObject since it does not have a constructor.
  // We need a class that will create an instance of itself that we can then
  // access. Here this is done by making each method a spy.
  class MockStorage {
    constructor() {
      this.load = load;
      this.save = save;
    }
  }

  class MockProcessor {
    constructor() {
      this.persistTime = persistTime;
      this.processEvent = processEvent;
    }
  }

  beforeEach(() => {
    load = jasmine.createSpy('load');
    save = jasmine.createSpy('save');
    persistTime = jasmine.createSpy('persistTime');
    processEvent = jasmine.createSpy('processEvent');
  });

  describe(`calling the config function of measurement library`, () => {
    describe('does not call any eventProcessor functions', () => {
      executeSnippetBeforeAndAfterSetup(
          /* config= */
          (measure) =>
              measure('config', MockProcessor, {}, MockStorage, {}),
          /* test=  */ () => {
            expect(persistTime).not.toHaveBeenCalled();
            expect(processEvent).not.toHaveBeenCalled();
          });
    });

    describe('does not call any storageInterface functions', () => {
      executeSnippetBeforeAndAfterSetup(
          /* config= */
          (measure) =>
              measure('config', MockProcessor, {}, MockStorage, {}),
          /* test= */ () => {
            expect(load).not.toHaveBeenCalled();
            expect(save).not.toHaveBeenCalled();
          });
    });

    describe('makes one call to the data layer', () => {
      executeSnippetBeforeAndAfterSetup(
          /* config= */
          (measure) =>
              measure('config', MockProcessor, {}, MockStorage,
                  {}),
          /* test=  */ (dataLayer) => {
            expect(dataLayer.length).toBe(1);
          });
    });
  });

  describe('the behavior after a call to save', () => {
    describe(
        'calls persistTime once with parameters key, value', () => {
          executeSnippetBeforeAndAfterSetup(
              /* config= */ (measure) => {
                measure('config', MockProcessor, {}, MockStorage, {});
                measure('set', 'a key', 3);
              },
              /* test= */ () => {
                expect(persistTime).toHaveBeenCalledTimes(1);
                expect(persistTime).toHaveBeenCalledWith('a key', 3);
              });
        });

    describe('calls save on the storage interface if persistTime returns' +
        'a positive integer',
        () => {
          executeSnippetBeforeAndAfterSetup(
              /* config= */ (measure) => {
                persistTime.and.returnValue(1337);
                measure('config', MockProcessor, {}, MockStorage, {});
                measure('set', 'key', 'value');
              },
              /* test= */ () => {
                expect(save).toHaveBeenCalledTimes(1);
                expect(save).toHaveBeenCalledWith('key', 'value', 1337);
              });
        });

    describe('calls save on the storage interface if persistTime returns ' +
        'infinity.',
        () => {
          executeSnippetBeforeAndAfterSetup(
              /* config= */ (measure) => {
                persistTime.and.returnValue(
                    Number.POSITIVE_INFINITY);
                measure('config', MockProcessor, {}, MockStorage, {});
                measure('set', 'key', 'value');
              },
              /* test= */ () => {
                expect(save).toHaveBeenCalledTimes(1);
                expect(save).toHaveBeenCalledWith(
                    'key', 'value', Number.POSITIVE_INFINITY);
              });
        });

    describe('calls save on the storage interface if persistTime returns -1',
        () => {
          executeSnippetBeforeAndAfterSetup(
              /* config= */ (measure) => {
                persistTime.and.returnValue(-1);
                measure('config', MockProcessor, {}, MockStorage, {});
                measure('set', 'a', 'a');
              },
              /* test= */ () => {
                expect(save).toHaveBeenCalledTimes(1);
                expect(save).toHaveBeenCalledWith('a', 'a');
              });
        });

    describe('does not call save on the storage interface if persistTime ' +
        'returns 0', () => {
      executeSnippetBeforeAndAfterSetup(
          /* config= */ (measure) => {
            persistTime.and.returnValue(0);
            measure('config', MockProcessor, {}, MockStorage, {});
            measure('set', 'key', {value: 'ok'});
          },
          /* test= */ () => {
            expect(save).not.toHaveBeenCalled();
          });
    });

    describe('calls save on the storage interface even if persistTime ' +
        'returns 0 when a positive integer is passed to set', () => {
      executeSnippetBeforeAndAfterSetup(
          /* config= */ (measure) => {
            persistTime.and.returnValue(0);
            measure('config', MockProcessor, {}, MockStorage, {});
            measure('set', 'key', [1, 2], 213);
          },
          /* test= */ () => {
            expect(save).toHaveBeenCalledTimes(1);
            expect(save).toHaveBeenCalledWith('key', [1, 2], 213);
          });
    });

    describe('does not call save on the storage interface even if ' +
        'persistTime returns -1 when 0 is passed to set', () => {
      executeSnippetBeforeAndAfterSetup(
          /* config= */ (measure) => {
            persistTime.and.returnValue(-1);
            measure('config', MockProcessor, {}, MockStorage, {});
            measure('set', 'productive_function', () => {
            }, 0);
          },
          /* test= */ () => {
            expect(save).not.toHaveBeenCalled();
          });
    });
  });
});
