/*!
 * Copyright 2010 - 2017 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "pentaho/type/Context",
  "pentaho/type/SpecificationScope"
], function(Context, SpecificationScope) {
  "use strict";

  /* global describe:false, it:false, expect:false, beforeEach:false, Date:false */

  var context = new Context();
  var PentahoObject = context.get("pentaho/type/object");
  var PentahoString = context.get("pentaho/type/string");
  var PentahoNumber = context.get("pentaho/type/number");
  var PentahoBoolean = context.get("pentaho/type/boolean");

  describe("pentaho.type.Simple", function() {

    // Using pentaho/type/boolean because pentaho/type/simple is abstract

    var originalSpec = {v: false, f: "I'm a simple value"};

    describe("values", function() {

      describe("value with formatted info", function() {
        var value;

        beforeEach(function() {
          value = new PentahoBoolean(originalSpec);
        });

        describe("default", function() {
          it("should return primitive value and formatted value", function() {
            var spec = value.toSpec();

            expect(spec.v).toBe(originalSpec.v);
            expect(spec.f).toBe(originalSpec.f);
            expect(spec._).toBeUndefined();
          });
        });

        describe("omitFormatted: true and forceType: true", function() {
          it("should return primitive value and inline type ", function() {
            var spec = value.toSpec({omitFormatted: true, forceType: true});

            expect(spec.v).toBe(originalSpec.v);
            expect(spec.f).toBeUndefined();
            expect(spec._).toEqual(PentahoBoolean.type.toRefInContext());
          });
        });

        describe("omitFormatted: true and forceType: false", function() {
          it("should return primitive value, undefined formatted value, and undefined inline type", function() {
            var spec = value.toSpec({omitFormatted: true, forceType: false});

            expect(spec).toBe(originalSpec.v);
            expect(spec.f).toBeUndefined();
            expect(spec._).toBeUndefined();
          });
        });

        describe("omitFormatted: false and forceType: false", function() {
          it("should return primitive value, formatted value, and undefined inline type", function() {
            var spec = value.toSpec({forceType: false});

            expect(spec.v).toBe(originalSpec.v);
            expect(spec.f).toBe(originalSpec.f);
            expect(spec._).toBeUndefined();
          });
        });
      });

      describe("value without formatted info", function() {
        var value;

        beforeEach(function() {
          value = new PentahoBoolean(originalSpec.v);
        });

        describe("default", function() {
          it("should return primitive value", function() {
            var spec = value.toSpec();

            expect(spec).toBe(originalSpec.v);
          });
        });

        describe("omitFormatted: true and forceType: true", function() {
          it("should return primitive value and undefined formatted value", function() {
            var spec = value.toSpec({omitFormatted: true, forceType: true});

            expect(spec.v).toBe(originalSpec.v);
            expect(spec.f).toBeUndefined();
            expect(spec._).toEqual(PentahoBoolean.type.toRefInContext());
          });
        });

        describe("omitFormatted: true and forceType: false", function() {
          it("should return primitive value, undefined formatted value, and undefined inline type", function() {
            var spec = value.toSpec({omitFormatted: true, forceType: false});

            expect(spec).toBe(originalSpec.v);
            expect(spec.f).toBeUndefined();
            expect(spec._).toBeUndefined();
          });
        });

        describe("omitFormatted: false and forceType: false", function() {
          it("should return primitive value", function() {
            var spec = value.toSpec({forceType: false});

            expect(spec).toBe(originalSpec.v);
          });
        });
      });
    });

    describe("#toSpecInContext(keyArgs)", function() {
      // coverage
      it("should allow not specifying keyArgs", function() {
        var scope = new SpecificationScope();

        var value = new PentahoBoolean(true);

        value.toSpecInContext();

        scope.dispose();
      });

      it("should call _toJSONValue when keyArgs.isJson: true", function() {
        var scope = new SpecificationScope();

        var value = new PentahoBoolean(true);

        spyOn(value, "_toJSONValue").and.callThrough();

        value.toSpecInContext({isJson: true});

        scope.dispose();

        expect(value._toJSONValue).toHaveBeenCalled();
      });

      it("should not call _toJSONValue when keyArgs.isJson: false", function() {
        var scope = new SpecificationScope();

        var value = new PentahoBoolean(true);

        spyOn(value, "_toJSONValue");

        value.toSpecInContext({isJson: false});

        scope.dispose();

        expect(value._toJSONValue).not.toHaveBeenCalled();
      });

      it("should return cell format when _toJSONValue returns a plain object and keyArgs.isJson: true", function() {
        var scope = new SpecificationScope();

        var valueResult = {};
        var value = new PentahoObject({v: valueResult});

        spyOn(value, "_toJSONValue").and.returnValue(valueResult);

        var cellResult = value.toSpecInContext({isJson: true});

        scope.dispose();

        expect(cellResult instanceof Object).toBe(true);
        expect(cellResult.v).toBe(valueResult);
      });

      it("should return null when _toJSONValue returns null and keyArgs.isJson: true", function() {
        var scope = new SpecificationScope();

        var valueResult = {};
        var value = new PentahoObject({v: valueResult});

        spyOn(value, "_toJSONValue").and.returnValue(null);

        var cellResult = value.toSpecInContext({isJson: true});

        scope.dispose();

        expect(cellResult).toBe(null);
      });
    });

    describe("#_toJSONValue", function() {
      it("should return the value property", function() {
        var scope = new SpecificationScope();

        var value = new PentahoBoolean(true);

        expect(value._toJSONValue()).toBe(true);

        scope.dispose();

        // ---

        scope = new SpecificationScope();

        value = new PentahoBoolean(false);

        expect(value._toJSONValue()).toBe(false);

        scope.dispose();
      });
    });
  }); // pentaho.type.Simple

  // region Other Simple Types Test Helpers

  function testSimple(SimpleClass, primitiveValue) {

    var isPlainObject = (SimpleClass === PentahoObject) && (!!primitiveValue&& primitiveValue.constructor === Object);
    var isNumOrBoolOrStr = (SimpleClass === PentahoNumber) || (SimpleClass === PentahoBoolean) || (SimpleClass === PentahoString);

    describe("when declaredType is unspecified", function() {

      describe("when forceType: true", function() {

        it("should output a cell with the '_' inline type reference", function() {
          var value = new SimpleClass({v: primitiveValue});
          var spec = value.toSpec({forceType: true});

          expect(typeof spec).toBe("object");
          expect(spec._).toEqual(SimpleClass.type.toRefInContext());
        });

        it("should output the primitive value in the 'v' property", function() {
          var value = new SimpleClass({v: primitiveValue});
          var spec = value.toSpec({forceType: true});

          expect(spec.v).toBe(primitiveValue);
        });
      });

      describe("when forceType: false and omitFormatted: true", function() {

        if(isPlainObject) {

          describe("when the primitive value is a plain object", function() {

            it("should return a cell with a 'v' property", function() {

              expect(primitiveValue instanceof Object && primitiveValue.constructor === Object).toBe(true);

              var value = new SimpleClass({v: primitiveValue});

              var spec = value.toSpec({omitFormatted: true, forceType: false});

              expect(spec instanceof Object).toBe(true);
              expect(spec).not.toBe(primitiveValue);
              expect(spec.v).toBe(primitiveValue);
            });
          });
        } else {

          describe("when the primitive value is *not* a plain object", function() {

            it("should return the primitive value", function() {

              expect(primitiveValue instanceof Object && primitiveValue.constructor === Object).toBe(false);

              var value = new SimpleClass({v: primitiveValue});

              var spec = value.toSpec({omitFormatted: true, forceType: false});

              expect(spec).toBe(primitiveValue);
            });
          });
        }
      });
    });

    describe("when declaredType is the simple type", function() {

      describe("when forceType: true", function() {

        it("should output a cell with the '_' inline type reference", function() {
          var value = new SimpleClass({v: primitiveValue});
          var spec = value.toSpec({forceType: true, declaredType: SimpleClass.type});

          expect(typeof spec).toBe("object");
          expect(spec._).toEqual(SimpleClass.type.toRefInContext());
        });

        it("should output the primitive value in the 'v' property", function() {
          var value = new SimpleClass({v: primitiveValue});
          var spec = value.toSpec({forceType: true, declaredType: SimpleClass.type});

          expect(spec.v).toBe(primitiveValue);
        });
      });

      describe("when forceType: false and omitFormatted: true", function() {

        if(isPlainObject) {

          describe("when the primitive value is a plain object", function() {

            it("should return a cell with a 'v' property", function() {

              expect(primitiveValue instanceof Object && primitiveValue.constructor === Object).toBe(true);

              var value = new SimpleClass({v: primitiveValue});

              var spec = value.toSpec({omitFormatted: true, forceType: false, declaredType: SimpleClass.type});

              expect(spec instanceof Object).toBe(true);
              expect(spec).not.toBe(primitiveValue);
              expect(spec.v).toBe(primitiveValue);
            });
          });
        } else {

          describe("when the primitive value is *not* a plain object", function() {

            it("should return the primitive value", function() {

              expect(primitiveValue instanceof Object && primitiveValue.constructor === Object).toBe(false);

              var value = new SimpleClass({v: primitiveValue});

              var spec = value.toSpec({omitFormatted: true, forceType: false, declaredType: SimpleClass.type});

              expect(spec).toBe(primitiveValue);
            });
          });
        }
      });
    });

    describe("when declaredType is the simple type's ancestor (abstract)", function() {

      describe("when forceType: true", function() {

        it("should output a cell with the '_' inline type reference", function() {
          var value = new SimpleClass({v: primitiveValue});
          var spec = value.toSpec({forceType: true, declaredType: SimpleClass.type.ancestor});

          expect(typeof spec).toBe("object");
          expect(spec._).toEqual(SimpleClass.type.toRefInContext());
        });

        it("should output the primitive value in the 'v' property", function() {
          var value = new SimpleClass({v: primitiveValue});
          var spec = value.toSpec({forceType: true, declaredType: SimpleClass.type.ancestor});

          expect(spec.v).toBe(primitiveValue);
        });
      });

      describe("when forceType: false and omitFormatted: true", function() {

        if(isNumOrBoolOrStr) {

          it("should return the primitive value", function() {

            var value = new SimpleClass({v: primitiveValue});
            var spec = value.toSpec({forceType: false, omitFormatted: true, declaredType: SimpleClass.type.ancestor});

            expect(spec).toBe(primitiveValue);
          });

        } else {

          it("should output a cell with the '_' inline type reference", function() {
            var value = new SimpleClass({v: primitiveValue});
            var spec = value.toSpec({forceType: false, omitFormatted: true, declaredType: SimpleClass.type.ancestor});

            expect(typeof spec).toBe("object");
            expect(spec._).toEqual(SimpleClass.type.toRefInContext());
          });

          it("should output the primitive value in the 'v' property", function() {
            var value = new SimpleClass({v: primitiveValue});
            var spec = value.toSpec({forceType: false, omitFormatted: true, declaredType: SimpleClass.type.ancestor});

            expect(spec.v).toBe(primitiveValue);
          });
        }
      });

      describe("when forceType: false and omitFormatted: false", function() {

        it("should output a cell with the '_' inline type reference", function() {
          var value = new SimpleClass({v: primitiveValue, f: "Foo"});
          var spec = value.toSpec({forceType: false, omitFormatted: false, declaredType: SimpleClass.type.ancestor});

          expect(typeof spec).toBe("object");
          expect(spec._).toEqual(SimpleClass.type.shortId);
        });

        it("should output the primitive value in the 'v' property", function() {
          var value = new SimpleClass({v: primitiveValue, f: "Foo"});
          var spec = value.toSpec({forceType: false, omitFormatted: false, declaredType: SimpleClass.type.ancestor});

          expect(spec.v).toBe(primitiveValue);
        });

        it("should output the formatted value in the 'f' property", function() {
          var value = new SimpleClass({v: primitiveValue, f: "Foo"});
          var spec = value.toSpec({forceType: false, omitFormatted: false, declaredType: SimpleClass.type.ancestor});

          expect(spec.f).toBe("Foo");
        });
      });
    });
  }
  // endregion

  describe("pentaho.type.Boolean", function() {
    var SimpleClass = context.get("pentaho/type/boolean");
    var primitiveValue = true;

    testSimple(SimpleClass, primitiveValue);
  });

  describe("pentaho.type.Number", function() {
    var SimpleClass = context.get("pentaho/type/number");
    var primitiveValue = 10;

    testSimple(SimpleClass, primitiveValue);
  });

  describe("pentaho.type.String", function() {
    var SimpleClass = context.get("pentaho/type/string");
    var primitiveValue = "hello";

    testSimple(SimpleClass, primitiveValue);
  });

  describe("pentaho.type.Function", function() {
    var SimpleClass = context.get("pentaho/type/function");
    var primitiveValue = function() {};

    testSimple(SimpleClass, primitiveValue);
  });

  describe("pentaho.type.Date", function() {
    var SimpleClass = context.get("pentaho/type/date");
    var primitiveValue = new Date();

    testSimple(SimpleClass, primitiveValue);
  });

  describe("pentaho.type.Object", function() {
    var SimpleClass = context.get("pentaho/type/object");
    var primitiveValue = {foo: "bar"};

    testSimple(SimpleClass, primitiveValue);

    // ----

    function NonPlainClass() {}

    primitiveValue = new NonPlainClass();

    testSimple(SimpleClass, primitiveValue);
  });
});
