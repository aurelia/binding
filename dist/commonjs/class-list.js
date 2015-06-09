"use strict";

if (!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {

	(function (view) {

		"use strict";

		if (!("Element" in view)) return;

		var classListProp = "classList",
		    protoProp = "prototype",
		    elemCtrProto = view.Element[protoProp],
		    objCtr = Object,
		    strTrim = String[protoProp].trim || function () {
			return this.replace(/^\s+|\s+$/g, "");
		},
		    arrIndexOf = Array[protoProp].indexOf || function (item) {
			var i = 0,
			    len = this.length;
			for (; i < len; i++) {
				if (i in this && this[i] === item) {
					return i;
				}
			}
			return -1;
		},
		    DOMEx = function DOMEx(type, message) {
			this.name = type;
			this.code = DOMException[type];
			this.message = message;
		},
		    checkTokenAndGetIndex = function checkTokenAndGetIndex(classList, token) {
			if (token === "") {
				throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
			}
			if (/\s/.test(token)) {
				throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
			}
			return arrIndexOf.call(classList, token);
		},
		    ClassList = function ClassList(elem) {
			var trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
			    classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
			    i = 0,
			    len = classes.length;
			for (; i < len; i++) {
				this.push(classes[i]);
			}
			this._updateClassName = function () {
				elem.setAttribute("class", this.toString());
			};
		},
		    classListProto = ClassList[protoProp] = [],
		    classListGetter = function classListGetter() {
			return new ClassList(this);
		};

		DOMEx[protoProp] = Error[protoProp];
		classListProto.item = function (i) {
			return this[i] || null;
		};
		classListProto.contains = function (token) {
			token += "";
			return checkTokenAndGetIndex(this, token) !== -1;
		};
		classListProto.add = function () {
			var tokens = arguments,
			    i = 0,
			    l = tokens.length,
			    token,
			    updated = false;
			do {
				token = tokens[i] + "";
				if (checkTokenAndGetIndex(this, token) === -1) {
					this.push(token);
					updated = true;
				}
			} while (++i < l);

			if (updated) {
				this._updateClassName();
			}
		};
		classListProto.remove = function () {
			var tokens = arguments,
			    i = 0,
			    l = tokens.length,
			    token,
			    updated = false,
			    index;
			do {
				token = tokens[i] + "";
				index = checkTokenAndGetIndex(this, token);
				while (index !== -1) {
					this.splice(index, 1);
					updated = true;
					index = checkTokenAndGetIndex(this, token);
				}
			} while (++i < l);

			if (updated) {
				this._updateClassName();
			}
		};
		classListProto.toggle = function (token, force) {
			token += "";

			var result = this.contains(token),
			    method = result ? force !== true && "remove" : force !== false && "add";

			if (method) {
				this[method](token);
			}

			if (force === true || force === false) {
				return force;
			} else {
				return !result;
			}
		};
		classListProto.toString = function () {
			return this.join(" ");
		};

		if (objCtr.defineProperty) {
			var classListPropDesc = {
				get: classListGetter,
				enumerable: true,
				configurable: true
			};
			try {
				objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
			} catch (ex) {
				if (ex.number === -2146823252) {
					classListPropDesc.enumerable = false;
					objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
				}
			}
		} else if (objCtr[protoProp].__defineGetter__) {
			elemCtrProto.__defineGetter__(classListProp, classListGetter);
		}
	})(self);
} else {

	(function () {
		"use strict";

		var testElement = document.createElement("_");

		testElement.classList.add("c1", "c2");

		if (!testElement.classList.contains("c2")) {
			var createMethod = function createMethod(method) {
				var original = DOMTokenList.prototype[method];

				DOMTokenList.prototype[method] = function (token) {
					var i,
					    len = arguments.length;

					for (i = 0; i < len; i++) {
						token = arguments[i];
						original.call(this, token);
					}
				};
			};
			createMethod("add");
			createMethod("remove");
		}

		testElement.classList.toggle("c3", false);

		if (testElement.classList.contains("c3")) {
			var _toggle = DOMTokenList.prototype.toggle;

			DOMTokenList.prototype.toggle = function (token, force) {
				if (1 in arguments && !this.contains(token) === !force) {
					return force;
				} else {
					return _toggle.call(this, token);
				}
			};
		}

		testElement = null;
	})();
}