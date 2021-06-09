const SpecHelper = require('../../../api/services/helpers/SpecHelper');
import faker from 'faker';

describe('about SpecHelper operations.', () => {

  it('SpecHelper validateEach for object should success.', async () => {
    const struct = {
      a: 1,
      b: 2,
    }
    SpecHelper.validateEach(
      {
        source: struct,
        target: struct,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('SpecHelper validateEach for sub object should success.', async () => {
    const struct = {
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: {
          f: 4,
        }
      }
    }
    SpecHelper.validateEach(
      {
        source: struct,
        target: struct,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('SpecHelper validateEach for array should success.', async () => {
    const struct = {
      a: [1, 2, 3],
    }
    SpecHelper.validateEach(
      {
        source: struct,
        target: struct,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('SpecHelper validateEach for sub array should success.', async () => {
    const struct = {
      a: [[1, 2], [3, 4], 5],
    }
    SpecHelper.validateEach(
      {
        source: struct,
        target: struct,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('SpecHelper validateEach for object inside array should success.', async () => {
    const struct = {
      a: [{
        b: 1,
        c: 2,
      }, {
        d: 3,
        e: 4
      }]
    }
    SpecHelper.validateEach(
      {
        source: struct,
        target: struct,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('SpecHelper validateEach strictMode should success.', async () => {
    const struct = {
      a: 1,
    }
    SpecHelper.validateEach(
      {
        source: struct,
        target: struct,
      },
      {
        strictMode: true,
        log: true,
      },
    );
  });

  it('SpecHelper validateEach throw error.', async () => {
    // 一般結構拋錯
    try {
      SpecHelper.validateEach(
        {
          source: {
            a: 1,
          },
          target: {
          },
        },
        {
          strictMode: false,
          log: true,
        },
      );
    } catch (err) {
      err.message.should.be.eq("expected 'number' to equal 'undefined'");
    }

    // object inside array
    try {
      SpecHelper.validateEach(
        {
          source: {
            a: [{a: 1}],
          },
          target: {
            a: [{b: 1}],
          },
        },
        {
          strictMode: true,
          log: true,
        },
      );
    } catch (err) {
      err.message.should.be.eq("expected 'number' to equal 'undefined'");
    }

    // array
    try {
      SpecHelper.validateEach(
        {
          source: {
            a: [1, 2],
          },
          target: {
            a: [null, null],
          },
        },
        {
          strictMode: true,
          log: true,
        },
      );
    } catch (err) {
      err.message.should.be.eq("expected 'number' to equal 'object'");
    }

    // sub object
    try {
      SpecHelper.validateEach(
        {
          source: {
            a: {
              b: 1,
            },
          },
          target: {
            a: {
              c: 1,
            },
          },
        },
        {
          strictMode: true,
          log: true,
        },
      );
    } catch (err) {
      err.message.should.be.eq("expected 'number' to equal 'undefined'");
    }

    // strictMode
    try {
      SpecHelper.validateEach(
        {
          source: {
            a: 1,
          },
          target: {
            a: 2,
          },
        },
        {
          strictMode: true,
          log: true,
        },
      );
    } catch (err) {
      err.message.should.be.eq("expected 2 to deeply equal 1");
    }
  });
});
