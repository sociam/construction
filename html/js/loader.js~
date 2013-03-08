
/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true */

WebBox.load().then(function() {
	console.log('hello loaded complete');
	window.store = new WebBox.Store();
	store.login('electronic','foo').then(function() { 
		var box = store.get_box('constructs');
		box.fetch().then(function() {
			var box = store.boxes().get(b);
			box.fetch().then(function(box) {
				console.log('loaded --- ', box);
			});
		});			
	});		
});
