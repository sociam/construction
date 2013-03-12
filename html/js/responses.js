
/*global $,_,document,window,console,escape,Backbone,exports */
/*jslint vars:true, todo:true, sloppy:true */

// add the filter to your application module
var module = angular.module('responses', ['filters']);

angular.module('filters', []).
	filter('nows', function () {
        return function (text) {
			return text.replace(/\s/g,'');
		};
	});

// absolute hack >
// explanation: angularjs fails to expand {{construct.id}} on 
module.directive('renderHistogram', function() {
	return {
		link: function(scope,dom_element,attrs) {
			scope.update_histogram(scope.element, scope.construct.id, dom_element[0]);
		}
	};
});

function ResultsController($scope) {
	$scope.initialised = false;
	$scope.loading = 0; // spinner support
	$scope.error = '';
	$scope.element = undefined;
	$scope.elements = [];
	$scope.users = [];
	$scope.eliciations = [];

	var defined = function(x) {
		return x.filter(function(xx) { return xx !== undefined; });
	};
	
	$scope.error_header = 'uh oh!';
	var show_error = function(msg) {
		$scope.$apply(function() { $scope.error = msg; });
	};	
	var start_loading = function() { $scope.$apply(function() { $scope.loading++; }); };
	var end_loading = function() { $scope.$apply(function() { $scope.loading--; }); };
	$scope.nextElement = function() {
		$scope.element = $scope.elements[($scope.elements.indexOf($scope.element) + 1) % $scope.elements.length];
	};
	$scope.prevElement = function() {
		var previdx = ($scope.elements.indexOf($scope.element) - 1);
		$scope.element = $scope.elements[previdx < 0 ? $scope.elements.length -1 : previdx];
	};

	var nows = function(s) { return s.replace(/\s+/g,''); };

	$scope.update_histogram = function(element, construct_id, dom_element) {
		var c = d3.select(dom_element);
		u.assert(construct_id !== undefined, "construct id is not defined");
		c.selectAll('g').remove();
		
		var elicitations =
			$scope.elicitations.filter(function(el) {
				return el.get('element') &&
					el.get('element').indexOf(element.id) >= 0 &&
					el.get(construct_id) && el.get(construct_id).length > 0;
			});

		// debug
		window.es = $scope.elicitations;

		var margin = {top: 10, right: 30, bottom: 30, left: 30},
		   width = 400 - margin.left - margin.right,
		   height = 100 - margin.top - margin.bottom;
		
		var bins = [0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5]; //[1,2,3,4,5,6,7,8];
		
		var x = d3.scale.linear().domain([0, 8]).range([0, width]);
		var data =
			d3.layout.histogram()
			.bins(bins)(elicitations.map(function(e) { return e.get(construct_id)[0]; }));
		
		var y = d3.scale.linear()
			.domain([0, d3.max(data, function(d) { return d.y; })])
			.range([height, 0]);
		
		var xAxis = d3.svg.axis().scale(x).orient("bottom");
		
		var svg = c.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// console.log('data > ', data);
		// console.log('width ', data[0].x, data[0].dx, x(data[0].dx + data[0].x), x(1));		
		
		var bar = svg.selectAll(".bar")
			.data(data)
			.enter().append("g")
			.attr("class", "bar")
			.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
		
		bar.append("rect")
			.attr("x", 1)
			.attr("width", x(data[0].dx))
			.attr('fill', '#aef')
			.attr("height", function(d) { return height - (y(d.y)); });
		
		bar.append("text")
			.attr("dy", ".75em")
			.attr("y", 6)
			.attr("x", x(data[0].dx) / 2)
			.attr("text-anchor", "middle")
			.attr('fill', 'white')
			.text(function(d) { return d.y; });
		
		svg.append("g")
			.attr("class", "xaxis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
	};
	$scope.update_histograms = function(element) {
		if (element === undefined) {
			console.error('got undefined for update_histograms, so not doing anything');
			return;
		}
		d3.selectAll('.histogram').each(function() {
			var construct_id = d3.select(this).attr('data-construct');
			$scope.update_histogram(element, construct_id, this);
		});
	};	

	WebBox.load().then(function() {
		u = WebBox.utils;
		start_loading();
		var store = new WebBox.Store();
		store.login(params.username,params.password).then(function() {
			var box = store.get_or_create_box(params.database);
			window.box = box; /* TODO: debug */
			box.fetch().then(function() {
				u.when(box.get_obj_ids().map(function(oid) { return box.get_obj(oid); }))
					.then(function() {
						var objs = _.toArray(arguments);						
						$scope.$apply(function() {
							var elicitations = $scope.elicitations = objs.filter(function(x) { return x.get('type') && x.get('type').indexOf('elicitation') >= 0; });
							var users = $scope.users = _(defined(elicitations.map(function(x) { return x.get('expert') && x.get('expert')[0]; }))).uniq();
							var eids = _(defined(elicitations.map(function(x) { return x.get('element') && x.get('element')[0]; }))).uniq();
							var elements = $scope.elements = _(objs.filter(function(x) { return eids.indexOf(x.id) >= 0; })).uniq();
							var constructs = $scope.constructs =_(objs.filter(function(x) { return x.id.indexOf('construct') === 0; }))
								.chain()
								.sortBy(function(c) { return c.id; })
								.uniq()
								.value();							
							$scope.element = elements.length && elements[0];							
							$scope.loading--;
							$scope.initialised = true;
							/*
							console.log('post-eliciations-update');
							$scope.update_histograms($scope.element);
							*/
						});						
						$scope.$watch('element', function(newelement, oldelement) {
							u.debug('element changed , firing update histos ');
							$scope.update_histograms(newelement);
						});						
					}).fail(function(err) { show_error('could not get obj ', err); });
			}).fail(function () {
				// box fetch fail
				show_error('Could not load box. Please make sure your parameters are correct - box: ' + params.database);
				end_loading();
			});
		}).fail(function() {
			console.log('login fail');
			show_error('login failure - Please make sure your login params are correct - username:' + params.username);
		});
	});
}


