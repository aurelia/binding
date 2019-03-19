<a name="2.2.1"></a>
## [2.2.1](https://github.com/aurelia/binding/compare/2.2.0...2.2.1) (2019-03-18)


### Bug Fixes

* **all:** change es2015 back to native-modules ([13dd661](https://github.com/aurelia/binding/commit/13dd661))
* **build:** don't build declaration ([d359e83](https://github.com/aurelia/binding/commit/d359e83))
* **connectable-binding:** remove the silent limit of 100 observers per expression ([56ba36d](https://github.com/aurelia/binding/commit/56ba36d)), closes [#742](https://github.com/aurelia/binding/issues/742)



<a name="2.2.0"></a>
# [2.2.0](https://github.com/aurelia/binding/compare/2.1.7...2.2.0) (2019-01-18)


### Bug Fixes

* **typings:** Add "clear" as valid option for type ([c5f6486](https://github.com/aurelia/binding/commit/c5f6486))
* **typings:** Add "clear" type to collection splice interface ([c16f1f3](https://github.com/aurelia/binding/commit/c16f1f3))
* **typings:** Correct ICollectionObserverSplice generics ([52ca954](https://github.com/aurelia/binding/commit/52ca954))
* **typings:** Revert exposing some APIs, add reset param typing ([1aa9c43](https://github.com/aurelia/binding/commit/1aa9c43))
* **typings:** Update interfaces with missing property types and methods ([133edc3](https://github.com/aurelia/binding/commit/133edc3))



<a name="2.1.7"></a>
## [2.1.7](https://github.com/aurelia/binding/compare/2.1.6...2.1.7) (2018-12-01)


### Bug Fixes

* **parser:** throw on unterminated template literal ([5c5b5e3](https://github.com/aurelia/binding/commit/5c5b5e3))



<a name="2.1.6"></a>
## [2.1.6](https://github.com/aurelia/binding/compare/2.1.5...2.1.6) (2018-10-30)


### Bug Fixes

* **doc:** fix html5 syntax ([bfbb06a](https://github.com/aurelia/binding/commit/bfbb06a)), closes [/github.com/aurelia/templating/pull/647#issuecomment-427989601](https://github.com//github.com/aurelia/templating/pull/647/issues/issuecomment-427989601)
* **parser:** throw on unterminated quote instead of infinite loop ([4907f38](https://github.com/aurelia/binding/commit/4907f38))



<a name="2.1.5"></a>
## [2.1.5](https://github.com/aurelia/binding/compare/2.1.4...2.1.5) (2018-09-25)

### Bug Fixes

* Update constructor typings for DataAttributeObserver

<a name="2.1.4"></a>
## [2.1.4](https://github.com/aurelia/binding/compare/2.1.3...2.1.4) (2018-08-09)


### Bug Fixes

* **array-observation:** make marker non enumerable ([a06c801](https://github.com/aurelia/binding/commit/a06c801))



<a name="2.1.3"></a>
## [2.1.3](https://github.com/aurelia/binding/compare/2.1.2...2.1.3) (2018-08-02)


### Bug Fixes

* **ArrayObservation:** ensure patch applied only once ([72b5d6d](https://github.com/aurelia/binding/commit/72b5d6d))



<a name="2.1.2"></a>
## [2.1.2](https://github.com/aurelia/binding/compare/2.1.1...2.1.2) (2018-07-17)


### Bug Fixes

* **parser:** allow PrimaryExpression on the lefthand side of CallMember ([c161c3a](https://github.com/aurelia/binding/commit/c161c3a)), closes [#700](https://github.com/aurelia/binding/issues/700)



<a name="2.1.1"></a>
## [2.1.1](https://github.com/aurelia/binding/compare/2.1.0...2.1.1) (2018-06-22)


### Bug Fixes

* **parser:** left-to-right associativity for nested binary expressions with same precedence ([d2d867e](https://github.com/aurelia/binding/commit/d2d867e))
* **parser:** use loop instead of array.fill for IE10 compat ([a7080bd](https://github.com/aurelia/binding/commit/a7080bd))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/aurelia/binding/compare/2.0.0...2.1.0) (2018-06-19)


### Bug Fixes

* **ast:** preserve evaluation context for the tag in tagged template literals ([8528baa](https://github.com/aurelia/binding/commit/8528baa))
* **doc:** ICollectionObserverSplice Typescript interface ([92a0006](https://github.com/aurelia/binding/commit/92a0006))
* **EventManager:** remove unnecessary dereference ([e2f8866](https://github.com/aurelia/binding/commit/e2f8866))
* **expression-cloner:** add literal template ([d324785](https://github.com/aurelia/binding/commit/d324785))
* **literal-template:** only throw on invalid function when mustEvaluate is truthy ([766571d](https://github.com/aurelia/binding/commit/766571d))
* **parser:** allow $parent as an argument of binding behaviors and value converters ([f76de45](https://github.com/aurelia/binding/commit/f76de45)), closes [#608](https://github.com/aurelia/binding/issues/608)
* **typescript:** put back missing collection properties to ICollectionObserverSplice ([b4f7b28](https://github.com/aurelia/binding/commit/b4f7b28))
* **typings:** accept Set<any> for collectionObserver ([87ca285](https://github.com/aurelia/binding/commit/87ca285))


### Features

* **parser:** add basic support for template literals ([39021ef](https://github.com/aurelia/binding/commit/39021ef))
* **parser:** add expression operators 'in', 'instanceof', 'typeof', 'void' ([e849661](https://github.com/aurelia/binding/commit/e849661))
* **parser:** add support for non-ASCII identifiers in the Latin-1 supplement block ([dfaca35](https://github.com/aurelia/binding/commit/dfaca35)), closes [#640](https://github.com/aurelia/binding/issues/640)
* **parser:** add support for tagged template literals ([b9497d2](https://github.com/aurelia/binding/commit/b9497d2))


### Performance Improvements

* **parser:** add node microbench script ([37dfcb8](https://github.com/aurelia/binding/commit/37dfcb8))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/aurelia/binding/compare/1.7.1...2.0.0) (2018-05-09)

### Breaking Changes

* Removed lexer and merged into Parser. Up to 10x expression parse perf improvements.

### Bug Fixes

* **SelectValueObserver:** observe characterData mutation ([e982ae0](https://github.com/aurelia/binding/commit/e982ae0))

<a name="1.7.1"></a>
## [1.7.1](https://github.com/aurelia/binding/compare/1.7.0...1.7.1) (2018-03-18)


### Bug Fixes

* **EventSubscriber:** do nothing if disposed ([449e105](https://github.com/aurelia/binding/commit/449e105))



<a name="1.7.0"></a>
# [1.7.0](https://github.com/aurelia/binding/compare/1.6.0...1.7.0) (2018-03-17)


### Bug Fixes

* **doc:** css-attribute without interpolation explained ([3dcea9d](https://github.com/aurelia/binding/commit/3dcea9d))
* **EventManager:** prevent stopPropagation stack overflow ([011eca0](https://github.com/aurelia/binding/commit/011eca0)), closes [#649](https://github.com/aurelia/binding/issues/649)
* **EventManager:** typing ([cb63a87](https://github.com/aurelia/binding/commit/cb63a87))
* **typings:** add SelectValue/Checked Observers  ([b06cbc2](https://github.com/aurelia/binding/commit/b06cbc2))
* **typings:** ICollectionObserverSplice support for Map and Set ([49f46ce](https://github.com/aurelia/binding/commit/49f46ce))
* **Unparser:** fix typo in visitChain ([a90216c](https://github.com/aurelia/binding/commit/a90216c))


### Features

* **typescript:** add getContextFor definition ([c7ab819](https://github.com/aurelia/binding/commit/c7ab819))
* **typescript:** add ICollectionObserverSplice definition ([4e1244e](https://github.com/aurelia/binding/commit/4e1244e))


### Performance Improvements

* **EventManager:** enable dispose() pattern for addEventListener ([e60ea16](https://github.com/aurelia/binding/commit/e60ea16))



<a name="1.6.0"></a>
# [1.6.0](https://github.com/aurelia/binding/compare/1.5.0...v1.6.0) (2017-12-04)


### Bug Fixes

* **typescript:** add definition for DirtyCheckProperty ([2c29855](https://github.com/aurelia/binding/commit/2c29855)), closes [#648](https://github.com/aurelia/binding/issues/648)
* Improve internal binding expression implementation to better support SSR scenarios.


### Performance Improvements

* **Lexer:** operators array -> map ([3431ec2](https://github.com/aurelia/binding/commit/3431ec2))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/aurelia/binding/compare/1.4.0...v1.5.0) (2017-10-23)



<a name="1.4.0"></a>
# [1.4.0](https://github.com/aurelia/binding/compare/1.3.0...v1.4.0) (2017-10-23)


### Features

* **ObserverLocator:** special handling for src and href ([1c231ee](https://github.com/aurelia/binding/commit/1c231ee))
* **ValueConverter:** enable signal ([f6ad52a](https://github.com/aurelia/binding/commit/f6ad52a)), closes [#353](https://github.com/aurelia/binding/issues/353)



<a name="1.3.0"></a>
# [1.3.0](https://github.com/aurelia/binding/compare/1.2.2...v1.3.0) (2017-10-01)


### Bug Fixes

* **ParserImplementation:** allow use of $parent with | or & expressions ([a18fd33](https://github.com/aurelia/binding/commit/a18fd33)), closes [aurelia/framework#791](https://github.com/aurelia/framework/issues/791)
* **subscriber-collection:** fix removeSubscriber leak ([8fe6181](https://github.com/aurelia/binding/commit/8fe6181)), closes [#585](https://github.com/aurelia/binding/issues/585) [#555](https://github.com/aurelia/binding/issues/555)


### Features

* **Binding:** fromView, toView ([f232a73](https://github.com/aurelia/binding/commit/f232a73)), closes [aurelia/binding#33](https://github.com/aurelia/binding/issues/33)



<a name="1.2.1"></a>
## [1.2.1](https://github.com/aurelia/binding/compare/1.2.0...v1.2.1) (2017-03-23)


### Bug Fixes

* **AST:** pass lookupFunctions to all evaluate methods ([04e4e92](https://github.com/aurelia/binding/commit/04e4e92))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/aurelia/binding/compare/1.1.1...v1.2.0) (2017-02-26)


### Bug Fixes

* **Assign:** enable nesting assignments ([8186ef7](https://github.com/aurelia/binding/commit/8186ef7)), closes [#561](https://github.com/aurelia/binding/issues/561)
* **CheckedObserver:** handle undefined model ([#575](https://github.com/aurelia/binding/issues/575)) ([e16bb9e](https://github.com/aurelia/binding/commit/e16bb9e)), closes [#574](https://github.com/aurelia/binding/issues/574)
* **SelectValueObserver:** handle null model ([f3d80c9](https://github.com/aurelia/binding/commit/f3d80c9)), closes [#540](https://github.com/aurelia/binding/issues/540)


### Features

* **build:** make SVG support optional ([b2d68c8](https://github.com/aurelia/binding/commit/b2d68c8))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/aurelia/binding/compare/1.1.0...v1.1.1) (2017-01-06)


### Bug Fixes

* **array-observation:** coerce splice args ([#552](https://github.com/aurelia/binding/issues/552)) ([94899e0](https://github.com/aurelia/binding/commit/94899e0)), closes [aurelia/templating#470](https://github.com/aurelia/templating/issues/470)
* **map-observation:** change "add" property to "set" ([1fd7ebd](https://github.com/aurelia/binding/commit/1fd7ebd)), closes [#549](https://github.com/aurelia/binding/issues/549)



<a name="1.1.0"></a>
# [1.1.0](https://github.com/aurelia/binding/compare/1.0.9...v1.1.0) (2016-12-08)


### Bug Fixes

* **doc:** broken numeral and moment import ([9a37615](https://github.com/aurelia/binding/commit/9a37615)), closes [#504](https://github.com/aurelia/binding/issues/504)
* **EventManager:** capture bugfixes ([bb78aea](https://github.com/aurelia/binding/commit/bb78aea))
* **observable:** skip notify on same value assign ([fed8b6f](https://github.com/aurelia/binding/commit/fed8b6f)), closes [#544](https://github.com/aurelia/binding/issues/544)
* **Parser:** handle parent in CallMember ([048c8dd](https://github.com/aurelia/binding/commit/048c8dd))
* **StyleObserver:** convert camelCase style properties to kebab-case ([2bd5e0f](https://github.com/aurelia/binding/commit/2bd5e0f)), closes [#523](https://github.com/aurelia/binding/issues/523)
* **typings:** fix AccessMember constructor parameters order ([f858369](https://github.com/aurelia/binding/commit/f858369))


### Features

* **EventManager:** support capturing event ([d5da991](https://github.com/aurelia/binding/commit/d5da991))


### Performance Improvements

* **connect-queue:** mutate queue once per flush ([58224dd](https://github.com/aurelia/binding/commit/58224dd))
* **connect-queue:** remove map usage ([d676d63](https://github.com/aurelia/binding/commit/d676d63))



<a name="1.0.9"></a>
## [1.0.9](https://github.com/aurelia/binding/compare/1.0.8...v1.0.9) (2016-10-06)


### Bug Fixes

* **styleobserver:** check if value is defined ([c7495d2](https://github.com/aurelia/binding/commit/c7495d2))
* **styleobserver:** if statement for numeric check was wrong ([15a589b](https://github.com/aurelia/binding/commit/15a589b))
* **styleobserver:** proper null check ([7018a1d](https://github.com/aurelia/binding/commit/7018a1d))



<a name="1.0.8"></a>
## [1.0.8](https://github.com/aurelia/binding/compare/1.0.7...v1.0.8) (2016-10-06)


### Bug Fixes

* **Name:** preserve modified value on unbind ([a50d5e8](https://github.com/aurelia/binding/commit/a50d5e8)), closes [aurelia/templating#467](https://github.com/aurelia/templating/issues/467)



<a name="1.0.7"></a>
## [1.0.7](https://github.com/aurelia/binding/compare/1.0.6...v1.0.7) (2016-10-05)


### Bug Fixes

* **observable:** backing property should not be enumerable ([521270b](https://github.com/aurelia/binding/commit/521270b))
* **observable:** handle descriptor with set ([fa3dafb](https://github.com/aurelia/binding/commit/fa3dafb)), closes [#511](https://github.com/aurelia/binding/issues/511)
* **StyleObserver:** handle numbers ([ca4933d](https://github.com/aurelia/binding/commit/ca4933d)), closes [#518](https://github.com/aurelia/binding/issues/518)



<a name="1.0.6"></a>
## [1.0.6](https://github.com/aurelia/binding/compare/1.0.5...v1.0.6) (2016-09-29)


### Bug Fixes

* **typings:** add missing interface members ([631cac2](https://github.com/aurelia/binding/commit/631cac2))



<a name="1.0.5"></a>
## [1.0.5](https://github.com/aurelia/binding/compare/1.0.4...v1.0.5) (2016-09-29)


### Bug Fixes

* **AST:** remove evalList array cache ([73f1a3e](https://github.com/aurelia/binding/commit/73f1a3e)), closes [#495](https://github.com/aurelia/binding/issues/495)
* **observable:** enable chaining, enumerating ([6586cd2](https://github.com/aurelia/binding/commit/6586cd2)), closes [#501](https://github.com/aurelia/binding/issues/501)
* **ObserverLocator:** use correct observer for aria role ([ca1dd60](https://github.com/aurelia/binding/commit/ca1dd60)), closes [aurelia/framework#582](https://github.com/aurelia/framework/issues/582) [#486](https://github.com/aurelia/binding/issues/486)
* **Parser:** fix object literal parsing with ([52d01dd](https://github.com/aurelia/binding/commit/52d01dd)), closes [#502](https://github.com/aurelia/binding/issues/502)
* **StyleObserver:** enable !important override ([0872d12](https://github.com/aurelia/binding/commit/0872d12)), closes [aurelia/templating-resources#251](https://github.com/aurelia/templating-resources/issues/251)



<a name="1.0.4"></a>
## [1.0.4](https://github.com/aurelia/binding/compare/1.0.3...v1.0.4) (2016-09-07)


### Bug Fixes

* **StyleObserver:** parse complex styles ([044746f](https://github.com/aurelia/binding/commit/044746f))
* **typescript:** fix doc generation and add missing classes ([347ac4f](https://github.com/aurelia/binding/commit/347ac4f))
* **typings:** remove TypeScript 2.0 syntax ([e9003ee](https://github.com/aurelia/binding/commit/e9003ee))


### Features

* **observable:** add propertyName argument ([e7825eb](https://github.com/aurelia/binding/commit/e7825eb))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/aurelia/binding/compare/1.0.2...v1.0.3) (2016-08-29)



<a name="1.0.2"></a>
## [1.0.2](https://github.com/aurelia/binding/compare/1.0.1...v1.0.2) (2016-08-26)


### Bug Fixes

* **aurelia-binding.d.ts:** improve TypeScript definitions ([604a6a9](https://github.com/aurelia/binding/commit/604a6a9))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/aurelia/binding/compare/1.0.0...v1.0.1) (2016-07-29)


### Features

* **event-manager:** enable stopping propagation of delegated events ([91287cf](https://github.com/aurelia/binding/commit/91287cf)), closes [#467](https://github.com/aurelia/binding/issues/467)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/aurelia/binding/compare/1.0.0-rc.1.0.4...v1.0.0) (2016-07-27)


### Bug Fixes

* **EventManager:** fix delegate bubbling ([2c08d05](https://github.com/aurelia/binding/commit/2c08d05)), closes [#460](https://github.com/aurelia/binding/issues/460)



<a name="1.0.0-rc.1.0.4"></a>
# [1.0.0-rc.1.0.4](https://github.com/aurelia/binding/compare/1.0.0-rc.1.0.3...v1.0.0-rc.1.0.4) (2016-07-24)


### Bug Fixes

* **definitions:** use classes for expressions ([8181cf5](https://github.com/aurelia/binding/commit/8181cf5)), closes [#436](https://github.com/aurelia/binding/issues/436)



<a name="1.0.0-rc.1.0.3"></a>
# [1.0.0-rc.1.0.3](https://github.com/aurelia/binding/compare/1.0.0-rc.1.0.2...v1.0.0-rc.1.0.3) (2016-07-12)


### Bug Fixes

* **CheckedObserver:** handle falsey model ([9d39a1a](https://github.com/aurelia/binding/commit/9d39a1a))



<a name="1.0.0-rc.1.0.2"></a>
# [1.0.0-rc.1.0.2](https://github.com/aurelia/binding/compare/1.0.0-rc.1.0.1...v1.0.0-rc.1.0.2) (2016-06-23)


### Bug Fixes

* **observable:** fix TypeScript support ([a6db85e](https://github.com/aurelia/binding/commit/a6db85e)), closes [#438](https://github.com/aurelia/binding/issues/438)



<a name="1.0.0-rc.1.0.0"></a>
# [1.0.0-rc.1.0.0](https://github.com/aurelia/binding/compare/1.0.0-beta.2.0.7...v1.0.0-rc.1.0.0) (2016-06-22)


### Bug Fixes

* **observable:** fix usage with decorators function ([051a17a](https://github.com/aurelia/binding/commit/051a17a))



### 1.0.0-beta.1.3.6 (2016-05-17)


#### Bug Fixes

* **observer:** respect non-enumerable properties ([ff8f9c7d](http://github.com/aurelia/binding/commit/ff8f9c7d24f646fa888be416225a0a2a4cd1386e))


### 1.0.0-beta.1.3.5 (2016-05-10)


### 1.0.0-beta.1.3.4 (2016-05-04)


#### Bug Fixes

* **package:** add missing dependencies ([3b8cbc66](http://github.com/aurelia/binding/commit/3b8cbc660e37ecd533bb74951e932ac85baf7f53))


### 1.0.0-beta.1.3.3 (2016-05-03)


#### Bug Fixes

* **Binary:** handle adding undefined ([d2a88ddc](http://github.com/aurelia/binding/commit/d2a88ddc79305d761be1b1efba666da007943cb7), closes [#337](http://github.com/aurelia/binding/issues/337))
* **CheckedObserver:** synchronize on changes to input value ([f3147440](http://github.com/aurelia/binding/commit/f3147440743f5006f4834b63d90d6023a37bb758), closes [#320](http://github.com/aurelia/binding/issues/320))
* **array-observation:** do not notify on pop/shift of empty array ([d344831b](http://github.com/aurelia/binding/commit/d344831bd96e77870c9354f187cfd387be401dc7))


#### Features

* **camelCase:** handle hyphenated names ([315cfaa2](http://github.com/aurelia/binding/commit/315cfaa229c13da8355ee1dec201a09c7df507db))
* **logging:** warn when property can't be defined ([a6457c09](http://github.com/aurelia/binding/commit/a6457c098e18707ebd4e65448a5d6f984377fac4))


### 1.0.0-beta.1.3.2 (2016-04-13)


### 1.0.0-beta.1.3.1 (2016-03-29)


#### Bug Fixes

* **hasDeclaredDependencies:** handle deps already converted to ComputedExpression ([7160248a](http://github.com/aurelia/binding/commit/7160248ac50fe5e385384a9196c9602ffd315693), closes [#359](http://github.com/aurelia/binding/issues/359))


### 1.0.0-beta.1.3.0 (2016-03-22)


#### Bug Fixes

* **parser:** remove unnecessary spaces from unparser output ([e776287e](http://github.com/aurelia/binding/commit/e776287e7c51a09464bff123430e6407ef79f049))


#### Features

* **Expression:** enable cloning and rebasing ([d3e52957](http://github.com/aurelia/binding/commit/d3e52957b0cefa70ac7ae6dcfd07dfae73f30ada))
* **NameExpression:** enable binding behaviors ([f698c27a](http://github.com/aurelia/binding/commit/f698c27a4ab871bc9adeafe080d7692957a93b6a))
* **computedFrom:** support expressions ([461a3d56](http://github.com/aurelia/binding/commit/461a3d56ced2a51f705e6c069ac59e97771e93c6), closes [#149](http://github.com/aurelia/binding/issues/149))


### 1.0.0-beta.1.2.2 (2016-03-02)


#### Bug Fixes

* **all:** remove for/of loops ([7caea5d4](http://github.com/aurelia/binding/commit/7caea5d47e185d27cc3e9c696e934fb70113c183))


### 1.0.0-beta.1.2.1 (2016-03-01)


#### Bug Fixes

* **ast:** make AccessScope#assign resilient ([4661076c](http://github.com/aurelia/binding/commit/4661076c1af3d5ccd7b47c40da0d90b64de0cc23))


### 1.0.0-beta.1.2.0 (2016-03-01)


#### Bug Fixes

* ***-observation:** allow binding extended Map/Set ([a79f1486](http://github.com/aurelia/binding/commit/a79f1486fe5d2a93ed6346133121fb16bcaa700b))
* **all:** remove core-js dependency ([a48268df](http://github.com/aurelia/binding/commit/a48268dfdfe31cf4b2201c170d6b79139c6280a2))
* **bower:** remove core-js ([3076972b](http://github.com/aurelia/binding/commit/3076972b38a028d4d901f092f11aa72c3ad3e377))
* **decorator-observable:** TypeScript ([98219be8](http://github.com/aurelia/binding/commit/98219be8533aded633c5391964ef73ec85ea669b))
* **definitions:**
  * observable decorator definition ([d6244f22](http://github.com/aurelia/binding/commit/d6244f222e80bd37f3a72af71465860af80a0dad))
  * addEventListener function definition ([206e3422](http://github.com/aurelia/binding/commit/206e342282dfceaed0bfbde78220084ea836420d), closes [#317](http://github.com/aurelia/binding/issues/317))
* **element-observation:** handle extra spacing around css properties ([cb8a9074](http://github.com/aurelia/binding/commit/cb8a9074784206f285ee7d373eb90f1296c31366), closes [#325](http://github.com/aurelia/binding/issues/325))


#### Features

* **Binding:** enable custom observers during connect ([d31e9321](http://github.com/aurelia/binding/commit/d31e9321ae34aaa8e7678fc029fa1afd0ae914e8))
* **observable decorator:**
  * add decorator-observable ([92eef20a](http://github.com/aurelia/binding/commit/92eef20af8788f1ab64f4f61c9da53db448effd7))
  * observe local property decorator ([80c2dbc7](http://github.com/aurelia/binding/commit/80c2dbc72d281fc443a63cb75bbf64e5d248d97d))
* **observers:** enable extended maps and sets ([a5e1eccb](http://github.com/aurelia/binding/commit/a5e1eccb417e0828f9de4faeee2ca33c54b80a5d), closes [#319](http://github.com/aurelia/binding/issues/319))
* **ref:** support expressions ([1d80f7b5](http://github.com/aurelia/binding/commit/1d80f7b5dd86f6b0dcdca1176a6a36f729c353d2), closes [#214](http://github.com/aurelia/binding/issues/214))


### 1.0.0-beta.1.1.3 (2016-02-09)


#### Bug Fixes

* **StyleObserver:** parse style without breaking urls ([432fe387](http://github.com/aurelia/binding/commit/432fe3873cce9c8b954325282b301f7d655e0b1f), closes [#301](http://github.com/aurelia/binding/issues/301))


### 1.0.0-beta.1.1.2 (2016-02-08)


### 1.0.0-beta.1.1.1 (2016-01-30)


#### Bug Fixes

* **build:** missing files ([e594a7d8](http://github.com/aurelia/binding/commit/e594a7d8fc1c4613e993aea945f0bacad035f565))


### 1.0.0-beta.1.1.0 (2016-01-29)

#### Bug Fixes

* **AccessKeyed:** avoid dirty-checking keyed array access ([7d01567a](http://github.com/aurelia/binding/commit/7d01567a00f5b0bb334b48614300273f7a99caed), closes [#289](http://github.com/aurelia/binding/issues/289))
* **StyleObserver:** set style properties individually ([8e9a2eb5](http://github.com/aurelia/binding/commit/8e9a2eb5b55106c32d6c4b1c6d60af5de6d9f4b1), closes [#290](http://github.com/aurelia/binding/issues/290))
* **choice-observers:** notify on setValue ([86722faf](http://github.com/aurelia/binding/commit/86722faf435ca9b667c28d0ced4235b06c88e30c), closes [#251](http://github.com/aurelia/binding/issues/251))
* **definitions:** no implicit any ([eff3162e](http://github.com/aurelia/binding/commit/eff3162efedff7af4ef1b772e61ff49ce6f28460), closes [#286](http://github.com/aurelia/binding/issues/286))


#### Features

* **Parser:** parse es6 shorthand initializers ([0d28ff91](http://github.com/aurelia/binding/commit/0d28ff91686853baacb583fa824618409ed4d1d4))
* **all:** update jspm meta; core-js; aurelia deps ([b93daa46](http://github.com/aurelia/binding/commit/b93daa4681ea970b5310fa5bef3e63a55788cc3e))


### 1.0.0-beta.1.0.5 (2016-01-08)


#### Bug Fixes

* **dts:** add missing export ([6c1f3f17](http://github.com/aurelia/binding/commit/6c1f3f17cb78040488d3e17dfac9fceedbb834bb))


### 1.0.0-beta.1.0.4 (2016-01-08)


#### Bug Fixes

* **ClassObserver:** split classes by any ASCII whitespace. ([776eef49](http://github.com/aurelia/binding/commit/776eef4956a07648de4a15cce4273ddcb13e348d), closes [#257](http://github.com/aurelia/binding/issues/257))
* **ObserverLocator:** getAccessor incorrectly handles input.value ([ae751048](http://github.com/aurelia/binding/commit/ae751048b43f96e60b7874a2cb569b20b04d0100), closes [#264](http://github.com/aurelia/binding/issues/264))
* **ValueAttributeObserver:** notify only when changing element value ([6ac4d42d](http://github.com/aurelia/binding/commit/6ac4d42d28bcaf888e186dfd8795d4fb5956ced3))
* **subscriberCollection:** handle cascading calls ([5b3ae75f](http://github.com/aurelia/binding/commit/5b3ae75fb216d898b6b56b3a18a1f0981263c865), closes [#252](http://github.com/aurelia/binding/issues/252))


#### Features

* **Array:** observe array prototype methods ([f34972dc](http://github.com/aurelia/binding/commit/f34972dc5187c1762b2ac749c3d92fbb3669dad9))
* **SetObservation:** add set observation ([9bb17313](http://github.com/aurelia/binding/commit/9bb1731399669a0b18d62b04bf0856609d2888be))
* **api:** export mergeSplice ([c909ba22](http://github.com/aurelia/binding/commit/c909ba22d897f260a9d2eaf5e4f37919a8c36cfa))


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
* **EventManager:** delegate and direct event subscription reversed ([11e36493](http://github.com/aur