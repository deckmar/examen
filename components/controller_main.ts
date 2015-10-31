/// <reference path="../typings/tsd.d.ts" />

class Topic {
	name : string;
	constructor(name) {
		this.name = name;
	}
}

enum Level {
	A = 1,
	B = 2,
	C = 3,
	AV = 4
}

class Course {
	courseId : string;
	name : string;
	level : Level;
	points : number;
	topic : Topic;
}

class Examen {
	name : string;
	constraints : Constraint[];
	constructor(name, constraints) {
		this.name = name;
		this.constraints = constraints;
	}
}

class Solution {
	solutionExams : SolutionExamen[];
}

class SolutionExamen {
	examen : Examen;
	courseList : Course[];
	constructor(exam : Examen) {
		this.examen = exam;
		this.courseList = [];
	}
}


class Constraint {
	type : string;
	validate(courseList : Course[]) { return false; };
}

class SpecificCourseConstraint extends Constraint {
	courseId : string;
	constructor(courseId = "") {
		super();
		this.courseId = courseId;
		this.type = 'SpecificCourseConstraint';
	}
	validate(courseList : Course[]) {
		return !!_.findWhere(courseList, {courseId: this.courseId});
	}
};

class MinimumConstraint extends Constraint {
	topic : Topic;
	minimumPoints : number;
	minimumLevel : Level;
	constructor(topic, minimumLevel, minimumPoints) {
		super();
		this.topic = topic;
		this.minimumPoints = minimumPoints;
		this.minimumLevel = minimumLevel;
		this.type = 'MinimumConstraint';
	}
	validate(courseList : Course[]) {
		var courses = courseList;

		if (this.topic && this.topic.name.indexOf("(*)") !== 0) {
			courses = _.reject(courses, (c) => c.topic.name != this.topic.name);
		}

		if (this.minimumLevel) {
			courses = _.reject(courses, (c) => c.level < this.minimumLevel);
		}

		if (this.minimumPoints) {
			return _.reduce(courses, (memo, c : Course) => { return memo + c.points; }, 0) >= this.minimumPoints;
		}

		return true;
	}
}

declare var app : angular.IModule;
app.controller('MainCtrl', function($scope, $state, $http) {

	var mainCtrl = this;

	// Test data
	mainCtrl.coursesTxt = "FY0012, Name One, A, 6.5hp\n" +
		"JO2111, Name Two, A, 6.5hp\n" +
		"MA0001, Name Three, A, 6.5hp\n" +
		"MA0002, Name Four, A, 6.5hp";

	mainCtrl.topics = [
		new Topic("(MA) Matematik"),
		new Topic("(FY) Fysik"),
		new Topic("(DA) Datateknik"),
		new Topic("(FÖ) Företagsekonomi"),
		new Topic("(JO) Journalistik"),
		new Topic("(*) Valfritt"),
	];

	mainCtrl.addTopic = function(topicStr : string) {
		return new Topic(topicStr.trim());
	}

	mainCtrl.examens = [
		new Examen("Kandidat i Industriell Ekonomi", [
			new MinimumConstraint(mainCtrl.topics[3], Level.C, 30),
			new MinimumConstraint(mainCtrl.topics[5], Level.A, 150),
		]),
		new Examen("Civilingenjör i Industriell Ekonomi", [
			new MinimumConstraint(mainCtrl.topics[5], Level.A, 150),
			new MinimumConstraint(mainCtrl.topics[3], Level.AV, 30),
		])
	];

	mainCtrl.addExamen = function(name : string) {
		mainCtrl.examens.push(new Examen(name, []));
	}

	mainCtrl.removeExamen = function(examen : Examen) {
		if (!confirm("Är du säker på att du vill ta bort denna?")) return;
		mainCtrl.examens = _.reject(mainCtrl.examens, (e) => e === examen);
	}

	mainCtrl.addConstraint = function(examen : Examen, type : string) {
		var constraint;
		if (type === "SpecificCourseConstraint") {
			constraint = new SpecificCourseConstraint("MA0000");
		} else if (type === "MinimumConstraint") {
			constraint = new MinimumConstraint(mainCtrl.topics[0], Level.A, 0);
		}

		examen.constraints.push(constraint);
	};


	mainCtrl.removeConstraint = function(examen : Examen, constraint : Constraint) {
		if (!confirm("Är du säker på att du vill ta bort denna?")) return;
		examen.constraints = _.reject(examen.constraints, (c) => c === constraint);
	}

	var validateSolution = function(solution : Solution) {
		return _.every(solution.solutionExams, function(se : SolutionExamen) {
			var originalExamen = _.find(mainCtrl.examens, (e : Examen) => e.name === se.examen.name);
			return _.every(originalExamen.constraints, (c : Constraint) => c.validate(se.courseList));
		});
	}

	var skipTheRest = false;
	var findPossibleSolutionStep = function(solution : Solution, courseIdx : number) {

		if (skipTheRest) return;

		if (courseIdx >= mainCtrl.courses.length) {
			//console.log("Hit the bottom", solution, courseIdx);
			if (validateSolution(solution)) {
				mainCtrl.possibleSolutions.push(solution);
				return true;
			}
			return false;
		}


		_.each(solution.solutionExams, function(e : SolutionExamen) {

			var solutionSub = angular.copy(solution);
			_.each(solutionSub.solutionExams, (e) => e.examen.constraints = null);
			var solutionEx = _.find(solutionSub.solutionExams, (se) => se.examen.name === e.examen.name);
			solutionEx.courseList.push(mainCtrl.courses[courseIdx]);
			var foundResult = findPossibleSolutionStep(solutionSub, courseIdx + 1);
			if (foundResult) skipTheRest = true;
		});

		return false;
	};

	var findPossibleSolutions = function() {
		if (!mainCtrl.courses) return;
		if (!mainCtrl.examens) return;

		mainCtrl.possibleSolutions = <Solution[]> [];
		skipTheRest = false;

		// To some sanity checks
		mainCtrl.error = false;
		if (!_.every(mainCtrl.courses, (c : Course) => !!c.topic)) {
			mainCtrl.error = "En eller flera kurser har en kurskod som inte kan matchas mot ett ämne. Lägg till ämnen som saknas.";
			return;
		}

		var possibleSolution = new Solution();
		possibleSolution.solutionExams = _.map(mainCtrl.examens, (e : Examen) => new SolutionExamen(e));

		findPossibleSolutionStep(possibleSolution, 0);

		console.log("Solutions", mainCtrl.possibleSolutions);
	};

	$scope.$watch('mainCtrl.coursesTxt', function() {
		if (!mainCtrl.coursesTxt) return;

		var parseToTopic = function(courseIdStr) {
			return _.find(mainCtrl.topics, (t : Topic) => courseIdStr.indexOf(t.name.replace(/\((.*)\).*/ig, '$1')) == 0)
		}

		var parseToPoints = function(pointsStr) {
			return parseFloat(pointsStr.replace(/,/g, '.').replace(/[^0-9\.]/g, ''));
		};

		var parseToLevel = function(levelStr) {
			switch(levelStr) {
				case "A":
					return Level.A;
				case "B":
					return Level.B;
				case "C":
					return Level.C;
				case "AV":
					return Level.AV;
			};
		};

		var parseToCourse = function(r) {
			var c = new Course();
			c.courseId = r[0].trim();
			c.name = r[1].trim();
			c.topic = parseToTopic(r[0].trim());
			c.points = parseToPoints(r[3].trim());
			c.level = parseToLevel(r[2].trim());
			return c;
		};

		mainCtrl.courses = _.chain(mainCtrl.coursesTxt.split('\n'))
			.map(function(r) { return r.trim(); })
			.reject(function(r) { return r.length == 0; })
			.reject(function(r) { return r[0] == "#"; })
			.map(function(r) { return r.split(','); })
			.filter(function(r) { return r.length === 4; })
			.map(parseToCourse)
			.value();
	});

	$scope.$watch('mainCtrl.courses', findPossibleSolutions);
	$scope.$watch('mainCtrl.examens', findPossibleSolutions, true);

});

app.filter('levelToString', function() {
	return function(level) {
		return Level[level].toString();
	};
})
