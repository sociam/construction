
/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true, sloppy:true */

var u;

var _d2o = function(response) {
	var rows = response[0].split('\n');
	var headers = rows[0].split('\t'), data = rows.slice(1);
	return data.map(function(r) {
		if (r.trim().length === 0) { return; }
		return u.dict(_.zip(headers,r.split('\t')));
	}).filter(function(x) { return x !== undefined; });
};

var load_data_into_box = function(box) {
	var loaddf = u.deferred();
	u.when([$.get('data/elements.txt'), $.get('data/constructs.txt')])
		.then(function(el_resp, con_resp) {
			var ds = [
				{prefix:'element-', data:_d2o(el_resp) },
				{prefix:'construct-', data:_d2o(con_resp) }
			].map(function(prefels) {
				var prefix = prefels.prefix, things = prefels.data;
				return things.map(function(el) {
					var d = u.deferred(), id = prefels.prefix+el.name;
					box.get_obj(id)
						.then(function(om) { om.set(el); d.resolve(id);	})
						.fail(d.reject);
					return d.promise();
				});
			});
			u.when(_(ds).flatten()).then(function() {
				var ids = _.toArray(arguments);
				box.save()
					.then(function() { loaddf.resolve(ids); })
					.fail(loaddf.reject);
			}).fail(loaddf.reject);
		});
	return loaddf.promise();
};

WebBox.load().then(function() {
	u = WebBox.utils;
	window.store = new WebBox.Store();
	store.login('electronic','foo').then(function() {
		store.fetch().then(function() {
			var box = store.get_or_create_box('constructs4');
			var helper = function() {
				load_data_into_box(box).then(function(results) {
					console.log('results >> ', results);
					$('#loaded').html(results.join('<li>'));
				});
			};
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
