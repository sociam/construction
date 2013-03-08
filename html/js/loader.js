
/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true */

var u;

var _d2o = function(response) {
	var rows = response[0].split('\n');
	var headers = rows[0].split('\t'), data = rows.slice(1);
	return data.map(function(r) {
		return u.dict(_.zip(headers,r.split('\t')));
	});
};

var load_data_into_box = function(box) {
	u.when([$.get('data/elements.txt'), $.get('data/constructs.txt')])
		.then(function(el_resp, con_resp) {
			var elements = _d2o(el_resp), constructs = _d2o(con_resp);
			elements.map(function(el) {
				var id = 'element-'+el.name;
				box.get_or_create(				
			});
			console.log('elements ', elements);
			console.log('constructs ', constructs);
		});
};

WebBox.load().then(function() {
	u = WebBox.utils;
	window.store = new WebBox.Store();
	store.login('electronic','foo').then(function() {
		store.fetch().then(function() {
			var box = store.get_or_create_box('constructs4');
			var helper = function() { load_data_into_box(box); };
			box.fetch().then(helper).fail(function() {
				// assume error is resulting from box not having
				// been created; let's try creating it and try again!
				box.save().then(helper).fail(function(err) {
					// nope, something else happened. let's die :( 
					console.error(err);
				});
			});
		});
	});		
});
