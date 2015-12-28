### 1.0.0-beta.1.0.3 (2015-12-16)


#### Bug Fixes

* **array-observation:** handle push then sort ([2ae6d0e4](http://github.com/aurelia/binding/commit/2ae6d0e46f85a865fcf3261ddf0298244573f185), closes [#233](http://github.com/aurelia/binding/issues/233))
* **binding:** check before assign ([44b5a669](http://github.com/aurelia/binding/commit/44b5a669d563d3aeb1268cad8058a8bbf51d21f8), closes [#258](http://github.com/aurelia/binding/issues/258))
* **file-input:** Firefox issue ([debed4e5](http://github.com/aurelia/binding/commit/debed4e5fa71ad99e2b97c3def6d605da4da884f), closes [#256](http://github.com/aurelia/binding/issues/256))


## 1.0.0-beta.1.0.2 (2015-12-03)


#### Bug Fixes

* **AccessKeyed:** evaluate null/undefined object should return undefined ([be97c8b6](http://github.com/aurelia/binding/commit/be97c8b638e7316b6af9c543291280e8282b53ac), closes [#241](http://github.com/aurelia/binding/issues/241))
* **Parser:** parse parent in LiteralObject ([c62280e4](http://github.com/aurelia/binding/commit/c62280e40dc4634ad230112437c8223f474674e0))
* **typings:** add missing argument types ([2662f7f6](http://github.com/aurelia/binding/commit/2662f7f61b56c581ac7ee9670b9c4c1fd3f213f0), closes [#232](http://github.com/aurelia/binding/issues/232))


#### Features

* **select:** enable matcher functions ([c69aa683](http://github.com/aurelia/binding/commit/c69aa683e5b0aff6745d88cbd8ff5ae35d34c34d), closes [#94](http://github.com/aurelia/binding/issues/94))


## 1.0.0-beta.1.0.1 (2015-11-16)


#### Bug Fixes

* **Parser:** disallow chain ([81c84bb3](http://github.com/aurelia/binding/commit/81c84bb369cf85f89a06dbb4b5e3e91415de166c))
* **typings:**
  * add types templating-resources uses. ([afa058a9](http://github.com/aurelia/binding/commit/afa058a92d67d8e718289de516f68ca820f7bcf8))
  * add missing types ([69f3c320](http://github.com/aurelia/binding/commit/69f3c3201bf82f160e74b4dfe5ee3c2c442ec7eb))


### 1.0.0-beta.1 (2015-11-16)


#### Bug Fixes

* **typings:** add missing types ([69f3c320](http://github.com/aurelia/binding/commit/69f3c3201bf82f160e74b4dfe5ee3c2c442ec7eb))


### 0.11.4 (2015-11-15)


#### Bug Fixes

* **Binding:** obey binding mode when called by signal ([fbca043e](http://github.com/aurelia/binding/commit/fbca043ef5dd2557fc09e9c04287e4272e8f7d40))
* **ModifyCollectionObserver:** handle out of bound splices ([6e801927](http://github.com/aurelia/binding/commit/6e801927caf9dfa91eed037e037815b30536946c))
* **definitions:** scope.bindingContext is not optional ([280de747](http://github.com/aurelia/binding/commit/280de74772b4b9eb479b2eb4db58602933656761))
* **typings:** BindingEngine and ObserverLocator are classes not interfaces ([c7339246](http://github.com/aurelia/binding/commit/c7339246adb094ebe06f7e93e5714e1faa618790))


### 0.11.3 (2015-11-12)


#### Bug Fixes

* **Listener:** directly reference overrideContext ([ce0f5a91](http://github.com/aurelia/binding/commit/ce0f5a910245bd9516cea5156b08eecf75d1568d), closes [#221](http://github.com/aurelia/binding/issues/221))


### 0.11.2 (2015-11-12)


#### Bug Fixes

* **ArrayObserver:** fix error when removing last array item ([5c8be37b](http://github.com/aurelia/binding/commit/5c8be37b7d73d432586a51ff4e213ce89aa215c2))


### 0.11.1 (2015-11-11)


## 0.11.0 (2015-11-10)


#### Bug Fixes

* **AST:** make $parent work with overrideContext changes ([1c0cfc88](http://github.com/aurelia/binding/commit/1c0cfc884a9cbf17dde9befc351aa31711e47a65))
* **all:** remove old decorators api calls; relocate decorators with related code ([0bf30806](http://github.com/aurelia/binding/commit/0bf3080621413a261de886df8e85cbc2c7f55113))
* **array-observation:** handle out of bounds splices ([154480ba](http://github.com/aurelia/binding/commit/154480ba04cbb6e19558b95be10ca2af8316c539))
* **build:** add scope to build files ([cb1a189a](http://github.com/aurelia/binding/commit/cb1a189a5482787e63c6d5fedf828cdb606f8d13))
* **doc:** Fix wrong URL in README.md ([9d8e583d](http://github.com/aurelia/binding/commit/9d8e583d086223b00b709a03f7ad8a60442033b7))
* **event-manager:** remove non-standard event target props for FF and old IE ([63b35ab4](http://github.com/aurelia/binding/commit/63b35ab4baecc07d5ca2d3598571adb85aa403fd))
* **name-expression:**
  * use the viewModel property of controllers ([42facec4](http://github.com/aurelia/binding/commit/42facec4bd88ba64b58ea9d5552ae09ff18c0045))
  * make more resilient to nulls ([162b8558](http://github.com/aurelia/binding/commit/162b85581e9b0887939e7d42cf7dc0c52c1fb45c))
  * not binding to proper context ([46f0fdc5](http://github.com/aurelia/binding/commit/46f0fdc5d3b989e01731775dff560d9a7e1b4e06))
* **scope:**
  * no auto-traverse when parent is specified ([735323ef](http://github.com/aurelia/binding/commit/735323efe7c9470e72b174d008108778ab6275e0))
  * connect undefined property on parent scope to correct bindingContext ([987e9555](http://github.com/aurelia/binding/commit/987e9555954fedc13ac074a4a58bb0dc9db7caf8))


#### Features

* **binding:** add override scope ([70adcada](http://github.com/aurelia/binding/commit/70adcadabcd2bbb93ac595d0cb79235e60c8f4da))
* **binding-behaviors:** add support for binding behaviors ([041a4a39](http://github.com/aurelia/binding/commit/041a4a396171f2ba3ea6f0cd8d83d533393a1d45), closes [#61](http://github.com/aurelia/binding/issues/61))
* **parser:** make '$this' return the scope ([31b081ee](http://github.com/aurelia/binding/commit/31b081ee477543f140ca416af6702ca0165ef1e8), closes [#50](http://github.com/aurelia/binding/issues/50))


### 0.10.2 (2015-10-17)


#### Bug Fixes

* **AST:** do not coerce operands of || or && to booleans ([1c4260ce](http://github.com/aurelia/binding/commit/1c4260cebc3fe6f4b3e73ee237af3295afc042d2))
* **AccessKeyedObserver:** handle PathObserver ([28c58bd3](http://github.com/aurelia/binding/commit/28c58bd38d03dadbfd60a01128088f85f3a84ee8))
* **ArrayObserveObserver:** unobserve array when there are no subscribers ([5e847640](http://github.com/aurelia/binding/commit/5e847640a3a3ca70648288c218e509a791c5493b))
* **Binding:** handle late call ([dfa8a407](http://github.com/aurelia/binding/commit/dfa8a4076a49e91411f9691d118a3c1cf4cd577e))
* **BindingExpression:** remove needless check for undefined ([afcc1ef3](http://github.com/aurelia/binding/commit/afcc1ef3b728e0304a9de207cebf19ff3c03a01b))
* **CallMember:** handle null/undefined member ([e23e1928](http://github.com/aurelia/binding/commit/e23e192872a904674760e50e68d71f66712c5fa1), closes [#177](http://github.com/aurelia/binding/issues/177))
* **ClassObserver:**
  * preserve order ([52de0824](http://github.com/aurelia/binding/commit/52de0824f8f3fd5b0c1e0628c58de8954d983fdb), closes [#211](http://github.com/aurelia/binding/issues/211))
  * handle null and undefined ([a8696e6a](http://github.com/aurelia/binding/commit/a8696e6a9236bafaf68584d1afa9a98aef423da1), closes [#109](http://github.com/aurelia/binding/issues/109))
* **CompositeObserver:** initialize var i ([fbe42fa7](http://github.com/aurelia/binding/commit/fbe42fa70d48caeec4f96ecd57d4e97f37b9048b))
* **EventManager:**
  * delegate and direct event subscription reversed ([11e36493](http://github.com/aurelia/binding/commit/11e364936b4726f34bf15268a112fc62d154b920))
  * Internet Explorer contenteditable ([2fa23b39](http://github.com/aurelia/binding/commit/2fa23b394afbc9b25f6493a98a8115a869355972))
* **Expression:** update with base class parameters ([2ad8495a](http://github.com/aurelia/binding/commit/2ad8495aac13faf1fa52cc426fb2f485767c180e))
* **ObserverLocator:**
  * handle properties of a primitive value ([6bf898a7](http://github.com/aurelia/binding/commit/6bf898a7107eca75120d42f22bff8f02e68ef03c), closes [#190](http://github.com/aurelia/binding/issues/190))
  * enable adapter installation after instantiation ([3fb369b1](http://github.com/aurelia/binding/commit/3fb369b1fac69ea087de8b450ae2a839d0bbf34c))
* **OoObjectObserver:**
  * unsubscribe leak ([9818841c](http://github.com/aurelia/binding/commit/9818841cfc67bf597f0739226d58f1ccdd403dd2))
  * regression issue with String.length observation ([df6a7e79](http://github.com/aurelia/binding/commit/df6a7e79507575f28509b25c3e654aa5cd7f4642), closes [#106](http://github.com/aurelia/binding/issues/106))
  * unobserve object when there are no subscribers ([0ebdd3db](http://github.com/aurelia/binding/commit/0ebdd3db32ce9391beada8b84d6b6371f641a6ed))
* **Parser:**
  * handle undefined ([0b18796f](http://github.com/aurelia/binding/commit/0b18796f0a538861e3e0a1fbb5ab49744a19c29b))
  * handle single escape chars ([bb7f72fb](http://github.com/aurelia/binding/commit/bb7f72fb1d51d16646cfa2e64c0e8b1ce9cbf915), closes [#182](http://github.com/aurelia/binding/issues/182))
* **SelectValueObserver:**
  * update model value when options change ([72701392](http://github.com/aurelia/binding/commit/727013927f35ee06706259dee3739ed4b906258f), closes [#83](http://github.com/aurelia/binding/issues/83))
  * handle late bound option values ([8a6b8f00](http://github.com/aurelia/binding/commit/8a6b8f0006458ce77f3dbd4c3f1d975d6614175a), closes [#54](http://github.com/aurelia/binding/issues/54))
* **SetterObserver:** change detection uses coercion ([71c7a299](http://github.com/aurelia/binding/commit/71c7a2993760e3ef438d3d7d48b91378fa63ddcb))
* **ValueAttributeObserver:** set undefined/null to empty string ([e18b1f60](http://github.com/aurelia/binding/commit/e18b1f60caefe324ca81aa060a339e9b23e5c888), closes [#152](http://github.com/aurelia/binding/issues/152))
* **all:**
  * correct internal operator usage ([4072c598](http://github.com/aurelia/binding/commit/4072c598ff0562947377a76f3a0c8610fb66b73a))
  * real javascript operator support for equality ([bbad0f38](http://github.com/aurelia/binding/commit/bbad0f381f1b27da049fd9eeb93816053dc7566e))
  * rename Filter to ValueConverter ([7f5e5785](http://github.com/aurelia/binding/commit/7f5e5785a197f18884281308275e67d7ceadb9da))
* **array-change-record:** provide correct addedCount ([d846b5d1](http://github.com/aurelia/binding/commit/d846b5d1d7330707bea23d18796795c39b702e19))
* **array-change-records:** set addedCount to 0 on delete ([fb6cbe9f](http://github.com/aurelia/binding/commit/fb6cbe9fd2574994787e2da43a5526f655ab21d2))
* **ast:**
  * correct (in)equality operators against null operands ([4036b33d](http://github.com/aurelia/binding/commit/4036b33d431a53dd2978cbd317a0fd44a3461fe8))
  * rename eval to evaluate to avoid name conflicts ([c3964e7c](http://github.com/aurelia/binding/commit/c3964e7ca34e962be88c65faa04730c349a7472b))
  * incorrect parameter reference during connection ([cd291b0c](http://github.com/aurelia/binding/commit/cd291b0c74d394ffd55ab4d8b3d7cfa0213aaa18))
* **binding:** Use correct import for core-js ([76fac6a4](http://github.com/aurelia/binding/commit/76fac6a455a70ed5c517f6979d6c225eda7c681a))
* **bindingMode:** change the value of oneTime ([c1ee8ec7](http://github.com/aurelia/binding/commit/c1ee8ec76891dce1624181f39a9bdef5550a24f2))
* **bower:** correct semver ranges ([88a94ad4](http://github.com/aurelia/binding/commit/88a94ad41b74b09e4b04a64a9f22317156ed8009))
* **build:**
  * update linting, testing and tools ([dbb5d08b](http://github.com/aurelia/binding/commit/dbb5d08b81556a907f0d1f03081977fa9041db8d))
  * add missing bower bump ([7d2172a2](http://github.com/aurelia/binding/commit/7d2172a2001dc23081b2bbee33c93653be2fa546))
* **call-expression:** incorrect unbind code ([3167f960](http://github.com/aurelia/binding/commit/3167f960f20fcf4c703d54a8c4f8470ca4471a4f), closes [#122](http://github.com/aurelia/binding/issues/122))
* **classList:** Element.classList polyfill Fixes: aurelia/framework#121 ([0a41adef](http://github.com/aurelia/binding/commit/0a41adef94a1c9f208efb469b05b8a4917b8b01a))
* **computed-observation:** allow setters ([9fc2a813](http://github.com/aurelia/binding/commit/9fc2a813e1a5cc0ae785d909f4b15c8978f2370d), closes [#136](http://github.com/aurelia/binding/issues/136))
* **decorators:**
  * update to metadata lowercased api names ([f1908e81](http://github.com/aurelia/binding/commit/f1908e81917de48ff4b91a71280711d45988d082))
  * use new metadata api ([31a0b6ec](http://github.com/aurelia/binding/commit/31a0b6ec52e5dc1380c99b9f99018d5d3ed444a9))
* **evalList:** fix syntax error for evalListCache ([dfa1e114](http://github.com/aurelia/binding/commit/dfa1e114727efec23078cc4da6f8517cf4e3de4f))
* **event-manager:**
  * address event targets with shadow dom and event delegation ([b8b49fe6](http://github.com/aurelia/binding/commit/b8b49fe6e30014efd4cf9ba42c198fa375e86958))
  * delegate event bug in IE ([782b83a6](http://github.com/aurelia/binding/commit/782b83a6561393c84302cf706f92568a4441577d))
  * rework delegated events to take advantage of dom boundaries ([8d33813e](http://github.com/aurelia/binding/commit/8d33813eb340c2136198916a4a757a2c577f5aab))
  * improve element config model ([afc9e37d](http://github.com/aurelia/binding/commit/afc9e37dbc93c8b06c0031def05170d58cc84383))
* **index:**
  * typo in decorator parameter ([e3e9042b](http://github.com/aurelia/binding/commit/e3e9042b974d4ad0f42f00a4b19fc6e0035377e2))
  * fix export ComputedPropertyObserver ([142f093a](http://github.com/aurelia/binding/commit/142f093aa41d5712738cadf925d9ebfb9c969a00))
  * incorrect import name ([3c88f272](http://github.com/aurelia/binding/commit/3c88f272658823e33b28b9b39a7020790b006ec0))
* **last:** prevent null refs on complex property path expressions ([68ab5073](http://github.com/aurelia/binding/commit/68ab50738e1a77b23bff96a86c1f017d9c39f91b))
* **listener-expression:** use result of handler for preventDefault behavior ([fce610b9](http://github.com/aurelia/binding/commit/fce610b95c39c9f1606cae1a686751fbc5e9117b), closes [#16](http://github.com/aurelia/binding/issues/16))
* **map-observation:**
  * remove missing import ([3f3a8e85](http://github.com/aurelia/binding/commit/3f3a8e8545b0823aeefa10c0e88c8d8d99ba8764))
  * instantiate ModifyMapObserver ([b0737c47](http://github.com/aurelia/binding/commit/b0737c47b69725a8b49f63ec7a06d39f9406e243))
* **name-expression:**
  * incorrect reference to bindingContext ([cf6b928b](http://github.com/aurelia/binding/commit/cf6b928baead02852baa7acba1f23891c5fccfee))
  * null out source on unbind ([e39b6b7d](http://github.com/aurelia/binding/commit/e39b6b7daa01e27251e3896be0fd519ac6708599))
  * no longer transform the mode ([b77098ee](http://github.com/aurelia/binding/commit/b77098eeea0ce2aa1bfbb9fb5eb4ae6a48265728))
  * enable ref binding to view-model and html behaviors ([451f09b3](http://github.com/aurelia/binding/commit/451f09b3b31fb3317282c4dc7b6146c610f298d4))
* **observer-locator:**
  * differentiate array observer storage from length prop storage ([992b4834](http://github.com/aurelia/binding/commit/992b483400d9a6fb76a743eb7eba3be71a57c2ea))
  * add Object.getPropertyDescriptor polyfill ([949cd344](http://github.com/aurelia/binding/commit/949cd344962614458defe0faa691347497e5abf6))
* **observers:** do not fail on primitive observation attempt ([854930a5](http://github.com/aurelia/binding/commit/854930a50685836111f97119b1295e07190d6f34))
* **package:**
  * change jspm directories ([91c6f8d1](http://github.com/aurelia/binding/commit/91c6f8d18380c45222ae996df3c668da782f04d2))
  * update dependencies ([b3ffcd5f](http://github.com/aurelia/binding/commit/b3ffcd5fd378a8ae4bce54c1949581447b5e2d92))
  * update dependencies ([ac2cef9c](http://github.com/aurelia/binding/commit/ac2cef9cd2d809b6d60193d1eb7edd8b7a1c1c8c))
  * update dependencies to latest ([e6e6deb9](http://github.com/aurelia/binding/commit/e6e6deb91084c7cf97e070bdd383edb6c9f562e1))
* **property-observation:** better update when in OO mode ([2d8ad7d5](http://github.com/aurelia/binding/commit/2d8ad7d57a543b35be6f6cc5b4792f10e5a5ab30))
* **tests:** adjust after build change ([5cc090de](http://github.com/aurelia/binding/commit/5cc090de74a282cd8e0dc3c768a74e222a280181))
* **value-converter:**
  * update to plug into new resource pipeline ([4e8c99d9](http://github.com/aurelia/binding/commit/4e8c99d9733cc9997754f40c78104e633ecab485))
  * add missing endsWith polyfill ([0e05f9cc](http://github.com/aurelia/binding/commit/0e05f9cc37bb73561883c7eddad50f2e030b147d))


#### Features

* **AccessKeyed:** fully observe access-keyed expressions ([0eb792cf](http://github.com/aurelia/binding/commit/0eb792cf05565f1eee7060021db7cb6002b7883e), closes [#75](http://github.com/aurelia/binding/issues/75), [#64](http://github.com/aurelia/binding/issues/64))
* **BindingSystem:** add binding system API ([cb75cde3](http://github.com/aurelia/binding/commit/cb75cde37ac677bb0d8c6f28140e8db3bd64e96c))
* **CallExpression:**
  * add $event to scope, use call args ([03bc3c62](http://github.com/aurelia/binding/commit/03bc3c6280bac4a1c06bfe1ca645fa0c85f1c913), closes [#46](http://github.com/aurelia/binding/issues/46))
  * enable passing function refs with call bindings ([1b333f0d](http://github.com/aurelia/binding/commit/1b333f0d7cf3e3d54df3812441f26ad460441aa6))
* **CheckedObserver:** checked binding ([1200935a](http://github.com/aurelia/binding/commit/1200935ad7fa9b1e5e75d71a46ab1531cb1c3de6), closes [#43](http://github.com/aurelia/binding/issues/43))
* **ClassObserver:** enable multiple class bindings ([69273136](http://github.com/aurelia/binding/commit/6927313661a9b1263aa634ba6f2ef9446d597976))
* **EventManager:** enable two-way scrollTop/scrollLeft binding Fixes: #98 ([543d845c](http://github.com/aurelia/binding/commit/543d845c533fc785b7b0de7651b50a3fa39086d2))
* **all:**
  * integrate pal ([bbcabc52](http://github.com/aurelia/binding/commit/bbcabc52b299df4a0b4335fe2ec5df9aa9cd38a9))
  * update compile, decorators and core-js ([7c83df98](http://github.com/aurelia/binding/commit/7c83df98c0f87866c1e35e7c60d3c227ac8048ae))
  * add decorators support ([ed0ff025](http://github.com/aurelia/binding/commit/ed0ff0258b3e764334cee9778a566ba526be18ee))
* **binding-expression:** convenience API for creating binding expressions, esp. for tests ([a8e11b5c](http://github.com/aurelia/binding/commit/a8e11b5ccf9e07b6a21125a3fcd25640b2ce297c))
* **binding-system:** lowercase to bindingSystem to promote standard JS casing ([32132891](http://github.com/aurelia/binding/commit/321328912a4fe9867dcdeb9287dcd9396f6bd65c))
* **build:** update compiler and switch to register module format ([b3a9c112](http://github.com/aurelia/binding/commit/b3a9c1128e82f2af622abf8309808a66e12d0ddc))
* **docs:**
  * generate api.json from .d.ts file ([6aa3caaa](http://github.com/aurelia/binding/commit/6aa3caaaba78142971e2c4bfbaee5c7d5d56db15))
  * generate api.json from .d.ts file ([e612055f](http://github.com/aurelia/binding/commit/e612055f7e5a98f4670be1838f993d512c4dea2f))
* **input:** Adds ability to bind to input type file ([1a52e061](http://github.com/aurelia/binding/commit/1a52e0611e31ea1b9ef89401815a236c905701e0))
* **listener-expression:** add prevent default option for event listeners ([1adc75a7](http://github.com/aurelia/binding/commit/1adc75a7f517fea0658b2648acfff3451d8ba21b))
* **map-observation:** implement map observation ([7a795785](http://github.com/aurelia/binding/commit/7a7957859773cba0ba3353d1e8e448caa13c417c))
* **name-expression:**
  * updated to reflect new templating controller architecture ([22095387](http://github.com/aurelia/binding/commit/220953879c869420ded0de88c227623f2b412a46))
  * make ref bindings work with api props ([0e6642eb](http://github.com/aurelia/binding/commit/0e6642eb23992e6dac20aceccd2eb789d5d82b62), closes [#87](http://github.com/aurelia/binding/issues/87))
  * prepare for new ref syntax ([f046e821](http://github.com/aurelia/binding/commit/f046e82182dfe6a5e7d6b3890ab42fc2c86217cb))
  * support explicit ref binding modes ([c2954228](http://github.com/aurelia/binding/commit/c2954228c43d9a433898f0d700683f6245ebdb62))
* **observer-locator:** enable custom observer locator through getter/setters ([f09451ce](http://github.com/aurelia/binding/commit/f09451cefb79a85f14b47c89bf6e2c1fa0ac008e))
* **package:** update Aurelia dependencies ([70acf72c](http://github.com/aurelia/binding/commit/70acf72cbdef8fadcc88fc258f18dd9c078e0541))
* **svg:** expanded svg support ([331a95da](http://github.com/aurelia/binding/commit/331a95da502dd2b28f992fdd2094fb3799c4acae), closes [#59](http://github.com/aurelia/binding/issues/59))
* **value-converter:**
  * update to latest view resources pipeline ([13f791bc](http://github.com/aurelia/binding/commit/13f791bc0cf67ca6acb60dc4ba97b5c74070d9cc))
  * update to new metadata system ([2156dc74](http://github.com/aurelia/binding/commit/2156dc74804beec90339373aeb0f5962744b49ac))
  * add fluent helper to metadata api ([63c1ecff](http://github.com/aurelia/binding/commit/63c1ecffd3e5fc8be6a1145a833bb3817ea1c2f1))
  * add fromView conversion ([8633d795](http://github.com/aurelia/binding/commit/8633d795123d52eca535c66627e6a9347a709782))
  * add toView conversion ([2de3f053](http://github.com/aurelia/binding/commit/2de3f053b9a7abff07fe8e124082a52c89aef4e6))


#### Breaking Changes

* This is a breaking API change that moves the ONE_WAY, TWO_WAY, and ONE_TIME constants into a bindingMode object with oneWay, twoWay, and oneTime properties.

 ([28e70532](http://github.com/aurelia/binding/commit/28e70532e1036db6c3bd2e05f6442ca301cff427))


### 0.10.1 (2015-10-15)


#### Bug Fixes

* **Binding:** handle late call ([dfa8a407](http://github.com/aurelia/binding/commit/dfa8a4076a49e91411f9691d118a3c1cf4cd577e))


## 0.10.0 (2015-10-13)


#### Bug Fixes

* **AST:** do not coerce operands of || or && to booleans ([1c4260ce](http://github.com/aurelia/binding/commit/1c4260cebc3fe6f4b3e73ee237af3295afc042d2))
* **AccessKeyedObserver:** handle PathObserver ([28c58bd3](http://github.com/aurelia/binding/commit/28c58bd38d03dadbfd60a01128088f85f3a84ee8))
* **ArrayObserveObserver:** unobserve array when there are no subscribers ([5e847640](http://github.com/aurelia/binding/commit/5e847640a3a3ca70648288c218e509a791c5493b))
* **BindingExpression:** remove needless check for undefined ([afcc1ef3](http://github.com/aurelia/binding/commit/afcc1ef3b728e0304a9de207cebf19ff3c03a01b))
* **CallMember:** handle null/undefined member ([e23e1928](http://github.com/aurelia/binding/commit/e23e192872a904674760e50e68d71f66712c5fa1), closes [#177](http://github.com/aurelia/binding/issues/177))
* **ClassObserver:**
  * preserve order ([52de0824](http://github.com/aurelia/binding/commit/52de0824f8f3fd5b0c1e0628c58de8954d983fdb), closes [#211](http://github.com/aurelia/binding/issues/211))
  * handle null and undefined ([a8696e6a](http://github.com/aurelia/binding/commit/a8696e6a9236bafaf68584d1afa9a98aef423da1), closes [#109](http://github.com/aurelia/binding/issues/109))
* **CompositeObserver:** initialize var i ([fbe42fa7](http://github.com/aurelia/binding/commit/fbe42fa70d48caeec4f96ecd57d4e97f37b9048b))
* **EventManager:**
  * delegate and direct event subscription reversed ([11e36493](http://github.com/aurelia/binding/commit/11e364936b4726f34bf15268a112fc62d154b920))
  * Internet Explorer contenteditable ([2fa23b39](http://github.com/aurelia/binding/commit/2fa23b394afbc9b25f6493a98a8115a869355972))
* **Expression:** update with base class parameters ([2ad8495a](http://github.com/aurelia/binding/commit/2ad8495aac13faf1fa52cc426fb2f485767c180e))
* **ObserverLocator:** enable adapter installation after instantiation ([3fb369b1](http://github.com/aurelia/binding/commit/3fb369b1fac69ea087de8b450ae2a839d0bbf34c))
* **OoObjectObserver:**
  * unsubscribe leak ([9818841c](http://github.com/aurelia/binding/commit/9818841cfc67bf597f0739226d58f1ccdd403dd2))
  * regression issue with String.length observation ([df6a7e79](http://github.com/aurelia/binding/commit/df6a7e79507575f28509b25c3e654aa5cd7f4642), closes [#106](http://github.com/aurelia/binding/issues/106))
  * unobserve object when there are no subscribers ([0ebdd3db](http://github.com/aurelia/binding/commit/0ebdd3db32ce9391beada8b84d6b6371f641a6ed))
* **Parser:**
  * handle undefined ([0b18796f](http://github.com/aurelia/binding/commit/0b18796f0a538861e3e0a1fbb5ab49744a19c29b))
  * handle single escape chars ([bb7f72fb](http://github.com/aurelia/binding/commit/bb7f72fb1d51d16646cfa2e64c0e8b1ce9cbf915), closes [#182](http://github.com/aurelia/binding/issues/182))
* **SelectValueObserver:**
  * update model value when options change ([72701392](http://github.com/aurelia/binding/commit/727013927f35ee06706259dee3739ed4b906258f), closes [#83](http://github.com/aurelia/binding/issues/83))
  * handle late bound option values ([8a6b8f00](http://github.com/aurelia/binding/commit/8a6b8f0006458ce77f3dbd4c3f1d975d6614175a), closes [#54](http://github.com/aurelia/binding/issues/54))
* **SetterObserver:** change detection uses coercion ([71c7a299](http://github.com/aurelia/binding/commit/71c7a2993760e3ef438d3d7d48b91378fa63ddcb))
* **ValueAttributeObserver:** set undefined/null to empty string ([e18b1f60](http://github.com/aurelia/binding/commit/e18b1f60caefe324ca81aa060a339e9b23e5c888), closes [#152](http://github.com/aurelia/binding/issues/152))
* **all:**
  * correct internal operator usage ([4072c598](http://github.com/aurelia/binding/commit/4072c598ff0562947377a76f3a0c8610fb66b73a))
  * real javascript operator support for equality ([bbad0f38](http://github.com/aurelia/binding/commit/bbad0f381f1b27da049fd9eeb93816053dc7566e))
  * rename Filter to ValueConverter ([7f5e5785](http://github.com/aurelia/binding/commit/7f5e5785a197f18884281308275e67d7ceadb9da))
* **array-change-record:** provide correct addedCount ([d846b5d1](http://github.com/aurelia/binding/commit/d846b5d1d7330707bea23d18796795c39b702e19))
* **array-change-records:** set addedCount to 0 on delete ([fb6cbe9f](http://github.com/aurelia/binding/commit/fb6cbe9fd2574994787e2da43a5526f655ab21d2))
* **ast:**
  * correct (in)equality operators against null operands ([4036b33d](http://github.com/aurelia/binding/commit/4036b33d431a53dd2978cbd317a0fd44a3461fe8))
  * rename eval to evaluate to avoid name conflicts ([c3964e7c](http://github.com/aurelia/binding/commit/c3964e7ca34e962be88c65faa04730c349a7472b))
  * incorrect parameter reference during connection ([cd291b0c](http://github.com/aurelia/binding/commit/cd291b0c74d394ffd55ab4d8b3d7cfa0213aaa18))
* **binding:** Use correct import for core-js ([76fac6a4](http://github.com/aurelia/binding/commit/76fac6a455a70ed5c517f6979d6c225eda7c681a))
* **bindingMode:** change the value of oneTime ([c1ee8ec7](http://github.com/aurelia/binding/commit/c1ee8ec76891dce1624181f39a9bdef5550a24f2))
* **bower:** correct semver ranges ([88a94ad4](http://github.com/aurelia/binding/commit/88a94ad41b74b09e4b04a64a9f22317156ed8009))
* **build:**
  * update linting, testing and tools ([dbb5d08b](http://github.com/aurelia/binding/commit/dbb5d08b81556a907f0d1f03081977fa9041db8d))
  * add missing bower bump ([7d2172a2](http://github.com/aurelia/binding/commit/7d2172a2001dc23081b2bbee33c93653be2fa546))
* **call-expression:** incorrect unbind code ([3167f960](http://github.com/aurelia/binding/commit/3167f960f20fcf4c703d54a8c4f8470ca4471a4f), closes [#122](http://github.com/aurelia/binding/issues/122))
* **classList:** Element.classList polyfill Fixes: aurelia/framework#121 ([0a41adef](http://github.com/aurelia/binding/commit/0a41adef94a1c9f208efb469b05b8a4917b8b01a))
* **computed-observation:** allow setters ([9fc2a813](http://github.com/aurelia/binding/commit/9fc2a813e1a5cc0ae785d909f4b15c8978f2370d), closes [#136](http://github.com/aurelia/binding/issues/136))
* **decorators:**
  * update to metadata lowercased api names ([f1908e81](http://github.com/aurelia/binding/commit/f1908e81917de48ff4b91a71280711d45988d082))
  * use new metadata api ([31a0b6ec](http://github.com/aurelia/binding/commit/31a0b6ec52e5dc1380c99b9f99018d5d3ed444a9))
* **evalList:** fix syntax error for evalListCache ([dfa1e114](http://github.com/aurelia/binding/commit/dfa1e114727efec23078cc4da6f8517cf4e3de4f))
* **event-manager:**
  * address event targets with shadow dom and event delegation ([b8b49fe6](http://github.com/aurelia/binding/commit/b8b49fe6e30014efd4cf9ba42c198fa375e86958))
  * delegate event bug in IE ([782b83a6](http://github.com/aurelia/binding/commit/782b83a6561393c84302cf706f92568a4441577d))
  * rework delegated events to take advantage of dom boundaries ([8d33813e](http://github.com/aurelia/binding/commit/8d33813eb340c2136198916a4a757a2c577f5aab))
  * improve element config model ([afc9e37d](http://github.com/aurelia/binding/commit/afc9e37dbc93c8b06c0031def05170d58cc84383))
* **index:**
  * typo in decorator parameter ([e3e9042b](http://github.com/aurelia/binding/commit/e3e9042b974d4ad0f42f00a4b19fc6e0035377e2))
  * fix export ComputedPropertyObserver ([142f093a](http://github.com/aurelia/binding/commit/142f093aa41d5712738cadf925d9ebfb9c969a00))
  * incorrect import name ([3c88f272](http://github.com/aurelia/binding/commit/3c88f272658823e33b28b9b39a7020790b006ec0))
* **last:** prevent null refs on complex property path expressions ([68ab5073](http://github.com/aurelia/binding/commit/68ab50738e1a77b23bff96a86c1f017d9c39f91b))
* **listener-expression:** use result of handler for preventDefault behavior ([fce610b9](http://github.com/aurelia/binding/commit/fce610b95c39c9f1606cae1a686751fbc5e9117b), closes [#16](http://github.com/aurelia/binding/issues/16))
* **map-observation:**
  * remove missing import ([3f3a8e85](http://github.com/aurelia/binding/commit/3f3a8e8545b0823aeefa10c0e88c8d8d99ba8764))
  * instantiate ModifyMapObserver ([b0737c47](http://github.com/aurelia/binding/commit/b0737c47b69725a8b49f63ec7a06d39f9406e243))
* **name-expression:**
  * incorrect reference to bindingContext ([cf6b928b](http://github.com/aurelia/binding/commit/cf6b928baead02852baa7acba1f23891c5fccfee))
  * null out source on unbind ([e39b6b7d](http://github.com/aurelia/binding/commit/e39b6b7daa01e27251e3896be0fd519ac6708599))
  * no longer transform the mode ([b77098ee](http://github.com/aurelia/binding/commit/b77098eeea0ce2aa1bfbb9fb5eb4ae6a48265728))
  * enable ref binding to view-model and html behaviors ([451f09b3](http://github.com/aurelia/binding/commit/451f09b3b31fb3317282c4dc7b6146c610f298d4))
* **observer-locator:**
  * differentiate array observer storage from length prop storage ([992b4834](http://github.com/aurelia/binding/commit/992b483400d9a6fb76a743eb7eba3be71a57c2ea))
  * add Object.getPropertyDescriptor polyfill ([949cd344](http://github.com/aurelia/binding/commit/949cd344962614458defe0faa691347497e5abf6))
* **observers:** do not fail on primitive observation attempt ([854930a5](http://github.com/aurelia/binding/commit/854930a50685836111f97119b1295e07190d6f34))
* **package:**
  * change jspm directories ([91c6f8d1](http://github.com/aurelia/binding/commit/91c6f8d18380c45222ae996df3c668da782f04d2))
  * update dependencies ([b3ffcd5f](http://github.com/aurelia/binding/commit/b3ffcd5fd378a8ae4bce54c1949581447b5e2d92))
  * update dependencies ([ac2cef9c](http://github.com/aurelia/binding/commit/ac2cef9cd2d809b6d60193d1eb7edd8b7a1c1c8c))
  * update dependencies to latest ([e6e6deb9](http://github.com/aurelia/binding/commit/e6e6deb91084c7cf97e070bdd383edb6c9f562e1))
* **property-observation:** better update when in OO mode ([2d8ad7d5](http://github.com/aurelia/binding/commit/2d8ad7d57a543b35be6f6cc5b4792f10e5a5ab30))
* **tests:** adjust after build change ([5cc090de](http://github.com/aurelia/binding/commit/5cc090de74a282cd8e0dc3c768a74e222a280181))
* **value-converter:**
  * update to plug into new resource pipeline ([4e8c99d9](http://github.com/aurelia/binding/commit/4e8c99d9733cc9997754f40c78104e633ecab485))
  * add missing endsWith polyfill ([0e05f9cc](http://github.com/aurelia/binding/commit/0e05f9cc37bb73561883c7eddad50f2e030b147d))


#### Features

* **AccessKeyed:** fully observe access-keyed expressions ([0eb792cf](http://github.com/aurelia/binding/commit/0eb792cf05565f1eee7060021db7cb6002b7883e), closes [#75](http://github.com/aurelia/binding/issues/75), [#64](http://github.com/aurelia/binding/issues/64))
* **BindingSystem:** add binding system API ([cb75cde3](http://github.com/aurelia/binding/commit/cb75cde37ac677bb0d8c6f28140e8db3bd64e96c))
* **CallExpression:**
  * add $event to scope, use call args ([03bc3c62](http://github.com/aurelia/binding/commit/03bc3c6280bac4a1c06bfe1ca645fa0c85f1c913), closes [#46](http://github.com/aurelia/binding/issues/46))
  * enable passing function refs with call bindings ([1b333f0d](http://github.com/aurelia/binding/commit/1b333f0d7cf3e3d54df3812441f26ad460441aa6))
* **CheckedObserver:** checked binding ([1200935a](http://github.com/aurelia/binding/commit/1200935ad7fa9b1e5e75d71a46ab1531cb1c3de6), closes [#43](http://github.com/aurelia/binding/issues/43))
* **ClassObserver:** enable multiple class bindings ([69273136](http://github.com/aurelia/binding/commit/6927313661a9b1263aa634ba6f2ef9446d597976))
* **EventManager:** enable two-way scrollTop/scrollLeft binding Fixes: #98 ([543d845c](http://github.com/aurelia/binding/commit/543d845c533fc785b7b0de7651b50a3fa39086d2))
* **all:**
  * integrate pal ([bbcabc52](http://github.com/aurelia/binding/commit/bbcabc52b299df4a0b4335fe2ec5df9aa9cd38a9))
  * update compile, decorators and core-js ([7c83df98](http://github.com/aurelia/binding/commit/7c83df98c0f87866c1e35e7c60d3c227ac8048ae))
  * add decorators support ([ed0ff025](http://github.com/aurelia/binding/commit/ed0ff0258b3e764334cee9778a566ba526be18ee))
* **binding-expression:** convenience API for creating binding expressions, esp. for tests ([a8e11b5c](http://github.com/aurelia/binding/commit/a8e11b5ccf9e07b6a21125a3fcd25640b2ce297c))
* **binding-system:** lowercase to bindingSystem to promote standard JS casing ([32132891](http://github.com/aurelia/binding/commit/321328912a4fe9867dcdeb9287dcd9396f6bd65c))
* **build:** update compiler and switch to register module format ([b3a9c112](http://github.com/aurelia/binding/commit/b3a9c1128e82f2af622abf8309808a66e12d0ddc))
* **docs:**
  * generate api.json from .d.ts file ([6aa3caaa](http://github.com/aurelia/binding/commit/6aa3caaaba78142971e2c4bfbaee5c7d5d56db15))
  * generate api.json from .d.ts file ([e612055f](http://github.com/aurelia/binding/commit/e612055f7e5a98f4670be1838f993d512c4dea2f))
* **input:** Adds ability to bind to input type file ([1a52e061](http://github.com/aurelia/binding/commit/1a52e0611e31ea1b9ef89401815a236c905701e0))
* **listener-expression:** add prevent default option for event listeners ([1adc75a7](http://github.com/aurelia/binding/commit/1adc75a7f517fea0658b2648acfff3451d8ba21b))
* **map-observation:** implement map observation ([7a795785](http://github.com/aurelia/binding/commit/7a7957859773cba0ba3353d1e8e448caa13c417c))
* **name-expression:**
  * updated to reflect new templating controller architecture ([22095387](http://github.com/aurelia/binding/commit/220953879c869420ded0de88c227623f2b412a46))
  * make ref bindings work with api props ([0e6642eb](http://github.com/aurelia/binding/commit/0e6642eb23992e6dac20aceccd2eb789d5d82b62), closes [#87](http://github.com/aurelia/binding/issues/87))
  * prepare for new ref syntax ([f046e821](http://github.com/aurelia/binding/commit/f046e82182dfe6a5e7d6b3890ab42fc2c86217cb))
  * support explicit ref binding modes ([c2954228](http://github.com/aurelia/binding/commit/c2954228c43d9a433898f0d700683f6245ebdb62))
* **observer-locator:** enable custom observer locator through getter/setters ([f09451ce](http://github.com/aurelia/binding/commit/f09451cefb79a85f14b47c89bf6e2c1fa0ac008e))
* **package:** update Aurelia dependencies ([70acf72c](http://github.com/aurelia/binding/commit/70acf72cbdef8fadcc88fc258f18dd9c078e0541))
* **svg:** expanded svg support ([331a95da](http://github.com/aurelia/binding/commit/331a95da502dd2b28f992fdd2094fb3799c4acae), closes [#59](http://github.com/aurelia/binding/issues/59))
* **value-converter:**
  * update to latest view resources pipeline ([13f791bc](http://github.com/aurelia/binding/commit/13f791bc0cf67ca6acb60dc4ba97b5c74070d9cc))
  * update to new metadata system ([2156dc74](http://github.com/aurelia/binding/commit/2156dc74804beec90339373aeb0f5962744b49ac))
  * add fluent helper to metadata api ([63c1ecff](http://github.com/aurelia/binding/commit/63c1ecffd3e5fc8be6a1145a833bb3817ea1c2f1))
  * add fromView conversion ([8633d795](http://github.com/aurelia/binding/commit/8633d795123d52eca535c66627e6a9347a709782))
  * add toView conversion ([2de3f053](http://github.com/aurelia/binding/commit/2de3f053b9a7abff07fe8e124082a52c89aef4e6))


#### Breaking Changes

* This is a breaking API change that moves the ONE_WAY, TWO_WAY, and ONE_TIME constants into a bindingMode object with oneWay, twoWay, and oneTime properties.

 ([28e70532](http://github.com/aurelia/binding/commit/28e70532e1036db6c3bd2e05f6442ca301cff427))


### 0.9.1 (2015-09-08)


#### Bug Fixes

* **name-expression:** incorrect reference to bindingContext ([cf6b928b](http://github.com/aurelia/binding/commit/cf6b928baead02852baa7acba1f23891c5fccfee))


## 0.9.0 (2015-09-04)


#### Bug Fixes

* **BindingExpression:** remove needless check for undefined ([afcc1ef3](http://github.com/aurelia/binding/commit/afcc1ef3b728e0304a9de207cebf19ff3c03a01b))
* **OoObjectObserver:** unsubscribe leak ([9818841c](http://github.com/aurelia/binding/commit/9818841cfc67bf597f0739226d58f1ccdd403dd2))
* **ValueAttributeObserver:** set undefined/null to empty string ([e18b1f60](http://github.com/aurelia/binding/commit/e18b1f60caefe324ca81aa060a339e9b23e5c888), closes [#152](http://github.com/aurelia/binding/issues/152))
* **build:** update linting, testing and tools ([dbb5d08b](http://github.com/aurelia/binding/commit/dbb5d08b81556a907f0d1f03081977fa9041db8d))


#### Features

* **docs:**
  * generate api.json from .d.ts file ([6aa3caaa](http://github.com/aurelia/binding/commit/6aa3caaaba78142971e2c4bfbaee5c7d5d56db15))
  * generate api.json from .d.ts file ([e612055f](http://github.com/aurelia/binding/commit/e612055f7e5a98f4670be1838f993d512c4dea2f))


### 0.8.6 (2015-08-14)


#### Bug Fixes

* **binding:** Use correct import for core-js ([76fac6a4](http://github.com/aurelia/binding/commit/76fac6a455a70ed5c517f6979d6c225eda7c681a))


### 0.8.5 (2015-08-05)


#### Bug Fixes

* **call-expression:** incorrect unbind code ([3167f960](http://github.com/aurelia/binding/commit/3167f960f20fcf4c703d54a8c4f8470ca4471a4f), closes [#122](http://github.com/aurelia/binding/issues/122))
* **event-manager:** address event targets with shadow dom and event delegation ([b8b49fe6](http://github.com/aurelia/binding/commit/b8b49fe6e30014efd4cf9ba42c198fa375e86958))
* **name-expression:** null out source on unbind ([e39b6b7d](http://github.com/aurelia/binding/commit/e39b6b7daa01e27251e3896be0fd519ac6708599))


### 0.8.4 (2015-07-30)


#### Bug Fixes

* **event-manager:** delegate event bug in IE ([782b83a6](http://github.com/aurelia/binding/commit/782b83a6561393c84302cf706f92568a4441577d))


### 0.8.3 (2015-07-29)


#### Bug Fixes

* **computed-observation:** allow setters ([9fc2a813](http://github.com/aurelia/binding/commit/9fc2a813e1a5cc0ae785d909f4b15c8978f2370d), closes [#136](http://github.com/aurelia/binding/issues/136))
* **event-manager:** rework delegated events to take advantage of dom boundaries ([8d33813e](http://github.com/aurelia/binding/commit/8d33813eb340c2136198916a4a757a2c577f5aab))


### 0.8.2 (2015-07-13)


#### Features

* **input:** Adds ability to bind to input type file ([1a52e061](http://github.com/aurelia/binding/commit/1a52e0611e31ea1b9ef89401815a236c905701e0))


### 0.8.1 (2015-07-07)


#### Bug Fixes

* **Expression:** update with base class parameters ([2ad8495a](http://github.com/aurelia/binding/commit/2ad8495aac13faf1fa52cc426fb2f485767c180e))


## 0.8.0 (2015-07-02)


#### Bug Fixes

* **decorators:** use new metadata api ([31a0b6ec](http://github.com/aurelia/binding/commit/31a0b6ec52e5dc1380c99b9f99018d5d3ed444a9))
* **tests:** adjust after build change ([5cc090de](http://github.com/aurelia/binding/commit/5cc090de74a282cd8e0dc3c768a74e222a280181))


#### Features

* **binding-expression:** convenience API for creating binding expressions, esp. for tests ([a8e11b5c](http://github.com/aurelia/binding/commit/a8e11b5ccf9e07b6a21125a3fcd25640b2ce297c))


### 0.7.3 (2015-06-10)


#### Bug Fixes

* **ClassObserver:** handle null and undefined ([a8696e6a](http://github.com/aurelia/binding/commit/a8696e6a9236bafaf68584d1afa9a98aef423da1), closes [#109](http://github.com/aurelia/binding/issues/109))


### 0.7.2 (2015-06-09)


#### Bug Fixes

* **OoObjectObserver:** regression issue with String.length observation ([df6a7e79](http://github.com/aurelia/binding/commit/df6a7e79507575f28509b25c3e654aa5cd7f4642), closes [#106](http://github.com/aurelia/binding/issues/106))


### 0.7.1 (2015-06-09)


#### Bug Fixes

* **name-expression:**
  * no longer transform the mode ([b77098ee](http://github.com/aurelia/binding/commit/b77098eeea0ce2aa1bfbb9fb5eb4ae6a48265728))
  * enable ref binding to view-model and html behaviors ([451f09b3](http://github.com/aurelia/binding/commit/451f09b3b31fb3317282c4dc7b6146c610f298d4))


## 0.7.0 (2015-06-08)


#### Bug Fixes

* **AST:** do not coerce operands of || or && to booleans ([1c4260ce](http://github.com/aurelia/binding/commit/1c4260cebc3fe6f4b3e73ee237af3295afc042d2))
* **ArrayObserveObserver:** unobserve array when there are no subscribers ([5e847640](http://github.com/aurelia/binding/commit/5e847640a3a3ca70648288c218e509a791c5493b))
* **EventManager:** delegate and direct event subscription reversed ([11e36493](http://github.com/aurelia/binding/commit/11e364936b4726f34bf15268a112fc62d154b920))
* **OoObjectObserver:** unobserve object when there are no subscribers ([0ebdd3db](http://github.com/aurelia/binding/commit/0ebdd3db32ce9391beada8b84d6b6371f641a6ed))
* **classList:** Element.classList polyfill Fixes: aurelia/framework#121 ([0a41adef](http://github.com/aurelia/binding/commit/0a41adef94a1c9f208efb469b05b8a4917b8b01a))


#### Features

* **ClassObserver:** enable multiple class bindings ([69273136](http://github.com/aurelia/binding/commit/6927313661a9b1263aa634ba6f2ef9446d597976))
* **EventManager:** enable two-way scrollTop/scrollLeft binding Fixes: #98 ([543d845c](http://github.com/aurelia/binding/commit/543d845c533fc785b7b0de7651b50a3fa39086d2))
* **name-expression:** make ref bindings work with api props ([0e6642eb](http://github.com/aurelia/binding/commit/0e6642eb23992e6dac20aceccd2eb789d5d82b62), closes [#87](http://github.com/aurelia/binding/issues/87))
* **observer-locator:** enable custom observer locator through getter/setters ([f09451ce](http://github.com/aurelia/binding/commit/f09451cefb79a85f14b47c89bf6e2c1fa0ac008e))
* **svg:** expanded svg support ([331a95da](http://github.com/aurelia/binding/commit/331a95da502dd2b28f992fdd2094fb3799c4acae), closes [#59](http://github.com/aurelia/binding/issues/59))


### 0.6.1 (2015-05-06)


#### Bug Fixes

* **property-observation:** better update when in OO mode ([2d8ad7d5](http://github.com/aurelia/binding/commit/2d8ad7d57a543b35be6f6cc5b4792f10e5a5ab30))


## 0.6.0 (2015-04-30)


#### Bug Fixes

* **AccessKeyedObserver:** handle PathObserver ([28c58bd3](http://github.com/aurelia/binding/commit/28c58bd38d03dadbfd60a01128088f85f3a84ee8))
* **EventManager:** Internet Explorer contenteditable ([2fa23b39](http://github.com/aurelia/binding/commit/2fa23b394afbc9b25f6493a98a8115a869355972))
* **SelectValueObserver:** update model value when options change ([72701392](http://github.com/aurelia/binding/commit/727013927f35ee06706259dee3739ed4b906258f), closes [#83](http://github.com/aurelia/binding/issues/83))
* **SetterObserver:** change detection uses coercion ([71c7a299](http://github.com/aurelia/binding/commit/71c7a2993760e3ef438d3d7d48b91378fa63ddcb))
* **bindingMode:** change the value of oneTime ([c1ee8ec7](http://github.com/aurelia/binding/commit/c1ee8ec76891dce1624181f39a9bdef5550a24f2))
* **index:** typo in decorator parameter ([e3e9042b](http://github.com/aurelia/binding/commit/e3e9042b974d4ad0f42f00a4b19fc6e0035377e2))


#### Features

* **AccessKeyed:** fully observe access-keyed expressions ([0eb792cf](http://github.com/aurelia/binding/commit/0eb792cf05565f1eee7060021db7cb6002b7883e), closes [#75](http://github.com/aurelia/binding/issues/75), [#64](http://github.com/aurelia/binding/issues/64))
* **CallExpression:** add $event to scope, use call args ([03bc3c62](http://github.com/aurelia/binding/commit/03bc3c6280bac4a1c06bfe1ca645fa0c85f1c913), closes [#46](http://github.com/aurelia/binding/issues/46))
* **value-converter:** update to new metadata system ([2156dc74](http://github.com/aurelia/binding/commit/2156dc74804beec90339373aeb0f5962744b49ac))


#### Breaking Changes

* This is a breaking API change that moves the ONE_WAY, TWO_WAY, and ONE_TIME constants into a bindingMode object with oneWay, twoWay, and oneTime properties.

 ([28e70532](http://github.com/aurelia/binding/commit/28e70532e1036db6c3bd2e05f6442ca301cff427))


## 0.5.0 (2015-04-09)


#### Bug Fixes

* **CompositeObserver:** initialize var i ([fbe42fa7](http://github.com/aurelia/binding/commit/fbe42fa70d48caeec4f96ecd57d4e97f37b9048b))
* **evalList:** fix syntax error for evalListCache ([dfa1e114](http://github.com/aurelia/binding/commit/dfa1e114727efec23078cc4da6f8517cf4e3de4f))
* **index:**
  * fix export ComputedPropertyObserver ([142f093a](http://github.com/aurelia/binding/commit/142f093aa41d5712738cadf925d9ebfb9c969a00))
  * incorrect import name ([3c88f272](http://github.com/aurelia/binding/commit/3c88f272658823e33b28b9b39a7020790b006ec0))
* **map-observation:** remove missing import ([3f3a8e85](http://github.com/aurelia/binding/commit/3f3a8e8545b0823aeefa10c0e88c8d8d99ba8764))


#### Features

* **all:**
  * update compile, decorators and core-js ([7c83df98](http://github.com/aurelia/binding/commit/7c83df98c0f87866c1e35e7c60d3c227ac8048ae))
  * add decorators support ([ed0ff025](http://github.com/aurelia/binding/commit/ed0ff0258b3e764334cee9778a566ba526be18ee))


### 0.4.1 (2015-03-30)


#### Bug Fixes

* **SelectValueObserver:** handle late bound option values ([8a6b8f00](http://github.com/aurelia/binding/commit/8a6b8f0006458ce77f3dbd4c3f1d975d6614175a), closes [#54](http://github.com/aurelia/binding/issues/54))


#### Features

* **CheckedObserver:** checked binding ([1200935a](http://github.com/aurelia/binding/commit/1200935ad7fa9b1e5e75d71a46ab1531cb1c3de6), closes [#43](http://github.com/aurelia/binding/issues/43))


## 0.4.0 (2015-03-25)

#### Features

* **EventManager:** enable two-way binding of contenteditable elements
* **ObserverLocator:** support value binding select elements

#### Bug Fixes

* **SelectValueObserver:** Safari and Internet Explorer
* **SelectValueObserver:** internet explorer fix
* **value-converter:** update to plug into new resource pipeline ([4e8c99d9](http://github.com/aurelia/binding/commit/4e8c99d9733cc9997754f40c78104e633ecab485))


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
