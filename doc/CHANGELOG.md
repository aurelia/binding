### 0.3.7 (2015-02-28)


#### Bug Fixes

* **package:** change jspm directories ([91c6f8d1](http://github.com/aurelia/binding/commit/91c6f8d18380c45222ae996df3c668da782f04d2))


### 0.3.6 (2015-02-28)


#### Bug Fixes

* **array-change-record:** provide correct addedCount ([d846b5d1](http://github.com/aurelia/binding/commit/d846b5d1d7330707bea23d18796795c39b702e19))
* **map-observation:** instantiate ModifyMapObserver ([b0737c47](http://github.com/aurelia/binding/commit/b0737c47b69725a8b49f63ec7a06d39f9406e243))
* **package:** update dependencies ([b3ffcd5f](http://github.com/aurelia/binding/commit/b3ffcd5fd378a8ae4bce54c1949581447b5e2d92))


### 0.3.5 (2015-02-18)


#### Bug Fixes

* **array-change-records:** set addedCount to 0 on delete ([fb6cbe9f](http://github.com/aurelia/binding/commit/fb6cbe9fd2574994787e2da43a5526f655ab21d2))
* **build:** add missing bower bump ([7d2172a2](http://github.com/aurelia/binding/commit/7d2172a2001dc23081b2bbee33c93653be2fa546))
* **listener-expression:** use result of handler for preventDefault behavior ([fce610b9](http://github.com/aurelia/binding/commit/fce610b95c39c9f1606cae1a686751fbc5e9117b), closes [#16](http://github.com/aurelia/binding/issues/16))
* **value-converter:** add missing endsWith polyfill ([0e05f9cc](http://github.com/aurelia/binding/commit/0e05f9cc37bb73561883c7eddad50f2e030b147d))


#### Features

* **map-observation:** implement map observation ([7a795785](http://github.com/aurelia/binding/commit/7a7957859773cba0ba3353d1e8e448caa13c417c))


### 0.3.4 (2015-02-06)


#### Bug Fixes

* **observers:** do not fail on primitive observation attempt ([854930a5](http://github.com/aurelia/binding/commit/854930a50685836111f97119b1295e07190d6f34))


### 0.3.3 (2015-02-03)


#### Bug Fixes

* **ast:** correct (in)equality operators against null operands ([4036b33d](http://github.com/aurelia/binding/commit/4036b33d431a53dd2978cbd317a0fd44a3461fe8))
* **last:** prevent null refs on complex property path expressions ([68ab5073](http://github.com/aurelia/binding/commit/68ab50738e1a77b23bff96a86c1f017d9c39f91b))


### 0.3.2 (2015-01-24)


#### Bug Fixes

* **bower:** correct semver ranges ([88a94ad4](http://github.com/aurelia/binding/commit/88a94ad41b74b09e4b04a64a9f22317156ed8009))


### 0.3.1 (2015-01-22)


#### Bug Fixes

* **ast:** rename eval to evaluate to avoid name conflicts ([c3964e7c](http://github.com/aurelia/binding/commit/c3964e7ca34e962be88c65faa04730c349a7472b))


## 0.3.0 (2015-01-22)


#### Bug Fixes

* **all:**
  * correct internal operator usage ([4072c598](http://github.com/aurelia/binding/commit/4072c598ff0562947377a76f3a0c8610fb66b73a))
  * real javascript operator support for equality ([bbad0f38](http://github.com/aurelia/binding/commit/bbad0f381f1b27da049fd9eeb93816053dc7566e))
* **event-manager:** improve element config model ([afc9e37d](http://github.com/aurelia/binding/commit/afc9e37dbc93c8b06c0031def05170d58cc84383))
* **package:** update dependencies ([ac2cef9c](http://github.com/aurelia/binding/commit/ac2cef9cd2d809b6d60193d1eb7edd8b7a1c1c8c))


#### Features

* **value-converter:** add fluent helper to metadata api ([63c1ecff](http://github.com/aurelia/binding/commit/63c1ecffd3e5fc8be6a1145a833bb3817ea1c2f1))


### 0.2.2 (2015-01-12)


#### Bug Fixes

* **ast:** incorrect parameter reference during connection ([cd291b0c](http://github.com/aurelia/binding/commit/cd291b0c74d394ffd55ab4d8b3d7cfa0213aaa18))


### 0.2.1 (2015-01-12)


#### Bug Fixes

* **observer-locator:** differentiate array observer storage from length prop storage ([992b4834](http://github.com/aurelia/binding/commit/992b483400d9a6fb76a743eb7eba3be71a57c2ea))


#### Features

* **name-expression:** prepare for new ref syntax ([f046e821](http://github.com/aurelia/binding/commit/f046e82182dfe6a5e7d6b3890ab42fc2c86217cb))
* **package:** update Aurelia dependencies ([70acf72c](http://github.com/aurelia/binding/commit/70acf72cbdef8fadcc88fc258f18dd9c078e0541))


## 0.2.0 (2015-01-06)


#### Bug Fixes

* **all:** rename Filter to ValueConverter ([7f5e5785](http://github.com/aurelia/binding/commit/7f5e5785a197f18884281308275e67d7ceadb9da))


#### Features

* **CallExpression:** enable passing function refs with call bindings ([1b333f0d](http://github.com/aurelia/binding/commit/1b333f0d7cf3e3d54df3812441f26ad460441aa6))
* **build:** update compiler and switch to register module format ([b3a9c112](http://github.com/aurelia/binding/commit/b3a9c1128e82f2af622abf8309808a66e12d0ddc))
* **name-expression:** support explicit ref binding modes ([c2954228](http://github.com/aurelia/binding/commit/c2954228c43d9a433898f0d700683f6245ebdb62))
* **value-converter:**
  * add fromView conversion ([8633d795](http://github.com/aurelia/binding/commit/8633d795123d52eca535c66627e6a9347a709782))
  * add toView conversion ([2de3f053](http://github.com/aurelia/binding/commit/2de3f053b9a7abff07fe8e124082a52c89aef4e6))


### 0.1.2 (2014-12-17)


#### Bug Fixes

* **package:** update dependencies to latest ([e6e6deb9](http://github.com/aurelia/binding/commit/e6e6deb91084c7cf97e070bdd383edb6c9f562e1))


### 0.1.1 (2014-12-12)


#### Features

* **listener-expression:** add prevent default option for event listeners ([1adc75a7](http://github.com/aurelia/binding/commit/1adc75a7f517fea0658b2648acfff3451d8ba21b))


## 0.1.0 (2014-12-11)


#### Bug Fixes

* **observer-locator:** add Object.getPropertyDescriptor polyfill ([949cd344](http://github.com/aurelia/binding/commit/949cd344962614458defe0faa691347497e5abf6))

