import {DirtyChecker} from '../src/index';
import {DirtyCheckProperty} from '../src/dirty-checking';

describe('dirty check property', () => {
	var obj;

	beforeEach(() =>{		
		obj = { foo: 'bar' };		
	});	

	it('getValue should return the value', () => {		
		var dirtyCheckProperty = new DirtyCheckProperty(new DirtyChecker(), obj, 'foo');

		expect(dirtyCheckProperty.getValue()).toBe('bar');
	});

	it('setValue should set the value', () => {		
		var dirtyCheckProperty = new DirtyCheckProperty(new DirtyChecker(), obj, 'foo');

		expect(dirtyCheckProperty.getValue()).toBe('bar');	
		dirtyCheckProperty.setValue('baz');
		expect(dirtyCheckProperty.getValue()).toBe('baz');
	});

	it('calls the callback function when value changes', () =>{			
		var someValue = obj.foo;
		jasmine.clock().install();
		
		var dirtyCheckProperty = new DirtyCheckProperty(new DirtyChecker(), obj, 'foo');

		var callback = function(newValue, oldValue){			
			someValue = newValue;
		};		

		dirtyCheckProperty.subscribe(callback);	
		jasmine.clock().tick(9999);	
		
		expect(someValue).toBe('bar');

		dirtyCheckProperty.setValue('baz');
		jasmine.clock().tick(9999);
		
		expect(someValue).toBe('baz');	
		jasmine.clock().uninstall();	
	});

	it('adds property when subscribing', () => {
		var dirtyChecker = new DirtyChecker();
		var dirtyCheckProperty = new DirtyCheckProperty(dirtyChecker, {}, 'foo');

		dirtyCheckProperty.subscribe(function(){});

		expect(dirtyChecker.tracked.length).toBe(1);
	});

	it('removes property on end tracking', () => {
		var dirtyChecker = new DirtyChecker();
		var dirtyCheckProperty = new DirtyCheckProperty(dirtyChecker, {}, 'foo');

		var resultToExecute = dirtyCheckProperty.subscribe(function(){});
		resultToExecute();		

		expect(dirtyChecker.tracked.length).toBe(0);
	});

	it('ends tracking if there are no callbacks', () => {
		var dirtyCheckProperty = new DirtyCheckProperty(new DirtyChecker(), {}, 'foo');

		var resultToExecute = dirtyCheckProperty.subscribe(function(){});	

		expect(dirtyCheckProperty.tracking).toBe(true);
		resultToExecute();
		expect(dirtyCheckProperty.tracking).toBe(false);
	});
	
	it('keeps tracking if there are callbacks', () => {
		var dirtyCheckProperty = new DirtyCheckProperty(new DirtyChecker(), {}, 'foo');
		
		dirtyCheckProperty.subscribe(function(){});
		var resultToExecute = dirtyCheckProperty.subscribe(function(){});
		resultToExecute();
		
		expect(dirtyCheckProperty.tracking).toBe(true);
	});	
});