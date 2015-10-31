var app = angular.module("examenApp", ["ui.router", 'ngAnimate', 'ngMaterial']);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

	$urlRouterProvider.otherwise('/');

	//$locationProvider.html5Mode(true);

	$stateProvider
		.state('root', {
			url: '/',
			controller: 'MainCtrl as mainCtrl',
			templateUrl: 'templates/pages/_root.html'
		})

})
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Topic = (function () {
    function Topic(name) {
        this.name = name;
    }
    return Topic;
})();
var Level;
(function (Level) {
    Level[Level["A"] = 1] = "A";
    Level[Level["B"] = 2] = "B";
    Level[Level["C"] = 3] = "C";
    Level[Level["AV"] = 4] = "AV";
})(Level || (Level = {}));
var Course = (function () {
    function Course() {
    }
    return Course;
})();
var Examen = (function () {
    function Examen(name, constraints) {
        this.name = name;
        this.constraints = constraints;
    }
    return Examen;
})();
var Solution = (function () {
    function Solution() {
    }
    return Solution;
})();
var SolutionExamen = (function () {
    function SolutionExamen(exam) {
        this.examen = exam;
        this.courseList = [];
    }
    return SolutionExamen;
})();
var Constraint = (function () {
    function Constraint() {
    }
    Constraint.prototype.validate = function (courseList) { return false; };
    ;
    return Constraint;
})();
var SpecificCourseConstraint = (function (_super) {
    __extends(SpecificCourseConstraint, _super);
    function SpecificCourseConstraint(courseId) {
        if (courseId === void 0) { courseId = ""; }
        _super.call(this);
        this.courseId = courseId;
        this.type = 'SpecificCourseConstraint';
    }
    SpecificCourseConstraint.prototype.validate = function (courseList) {
        return !!_.findWhere(courseList, { courseId: this.courseId });
    };
    return SpecificCourseConstraint;
})(Constraint);
;
var MinimumConstraint = (function (_super) {
    __extends(MinimumConstraint, _super);
    function MinimumConstraint(topic, minimumLevel, minimumPoints) {
        _super.call(this);
        this.topic = topic;
        this.minimumPoints = minimumPoints;
        this.minimumLevel = minimumLevel;
        this.type = 'MinimumConstraint';
    }
    MinimumConstraint.prototype.validate = function (courseList) {
        var _this = this;
        var courses = courseList;
        if (this.topic && this.topic.name.indexOf("(*)") !== 0) {
            courses = _.reject(courses, function (c) { return c.topic.name != _this.topic.name; });
        }
        if (this.minimumLevel) {
            courses = _.reject(courses, function (c) { return c.level < _this.minimumLevel; });
        }
        if (this.minimumPoints) {
            return _.reduce(courses, function (memo, c) { return memo + c.points; }, 0) >= this.minimumPoints;
        }
        return true;
    };
    return MinimumConstraint;
})(Constraint);
app.controller('MainCtrl', function ($scope, $state, $http) {
    var mainCtrl = this;
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
    mainCtrl.addTopic = function (topicStr) {
        return new Topic(topicStr.trim());
    };
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
    mainCtrl.addExamen = function (name) {
        mainCtrl.examens.push(new Examen(name, []));
    };
    mainCtrl.removeExamen = function (examen) {
        if (!confirm("Är du säker på att du vill ta bort denna?"))
            return;
        mainCtrl.examens = _.reject(mainCtrl.examens, function (e) { return e === examen; });
    };
    mainCtrl.addConstraint = function (examen, type) {
        var constraint;
        if (type === "SpecificCourseConstraint") {
            constraint = new SpecificCourseConstraint("MA0000");
        }
        else if (type === "MinimumConstraint") {
            constraint = new MinimumConstraint(mainCtrl.topics[0], Level.A, 0);
        }
        examen.constraints.push(constraint);
    };
    mainCtrl.removeConstraint = function (examen, constraint) {
        if (!confirm("Är du säker på att du vill ta bort denna?"))
            return;
        examen.constraints = _.reject(examen.constraints, function (c) { return c === constraint; });
    };
    var validateSolution = function (solution) {
        return _.every(solution.solutionExams, function (se) {
            var originalExamen = _.find(mainCtrl.examens, function (e) { return e.name === se.examen.name; });
            return _.every(originalExamen.constraints, function (c) { return c.validate(se.courseList); });
        });
    };
    var skipTheRest = false;
    var findPossibleSolutionStep = function (solution, courseIdx) {
        if (skipTheRest)
            return;
        if (courseIdx >= mainCtrl.courses.length) {
            if (validateSolution(solution)) {
                mainCtrl.possibleSolutions.push(solution);
                return true;
            }
            return false;
        }
        _.each(solution.solutionExams, function (e) {
            var solutionSub = angular.copy(solution);
            _.each(solutionSub.solutionExams, function (e) { return e.examen.constraints = null; });
            var solutionEx = _.find(solutionSub.solutionExams, function (se) { return se.examen.name === e.examen.name; });
            solutionEx.courseList.push(mainCtrl.courses[courseIdx]);
            var foundResult = findPossibleSolutionStep(solutionSub, courseIdx + 1);
            if (foundResult)
                skipTheRest = true;
        });
        return false;
    };
    var findPossibleSolutions = function () {
        if (!mainCtrl.courses)
            return;
        if (!mainCtrl.examens)
            return;
        mainCtrl.possibleSolutions = [];
        skipTheRest = false;
        mainCtrl.error = false;
        if (!_.every(mainCtrl.courses, function (c) { return !!c.topic; })) {
            mainCtrl.error = "En eller flera kurser har en kurskod som inte kan matchas mot ett ämne. Lägg till ämnen som saknas.";
            return;
        }
        var possibleSolution = new Solution();
        possibleSolution.solutionExams = _.map(mainCtrl.examens, function (e) { return new SolutionExamen(e); });
        findPossibleSolutionStep(possibleSolution, 0);
        console.log("Solutions", mainCtrl.possibleSolutions);
    };
    $scope.$watch('mainCtrl.coursesTxt', function () {
        if (!mainCtrl.coursesTxt)
            return;
        var parseToTopic = function (courseIdStr) {
            return _.find(mainCtrl.topics, function (t) { return courseIdStr.indexOf(t.name.replace(/\((.*)\).*/ig, '$1')) == 0; });
        };
        var parseToPoints = function (pointsStr) {
            return parseFloat(pointsStr.replace(/,/g, '.').replace(/[^0-9\.]/g, ''));
        };
        var parseToLevel = function (levelStr) {
            switch (levelStr) {
                case "A":
                    return Level.A;
                case "B":
                    return Level.B;
                case "C":
                    return Level.C;
                case "AV":
                    return Level.AV;
            }
            ;
        };
        var parseToCourse = function (r) {
            var c = new Course();
            c.courseId = r[0].trim();
            c.name = r[1].trim();
            c.topic = parseToTopic(r[0].trim());
            c.points = parseToPoints(r[3].trim());
            c.level = parseToLevel(r[2].trim());
            return c;
        };
        mainCtrl.courses = _.chain(mainCtrl.coursesTxt.split('\n'))
            .map(function (r) { return r.trim(); })
            .reject(function (r) { return r.length == 0; })
            .reject(function (r) { return r[0] == "#"; })
            .map(function (r) { return r.split(','); })
            .filter(function (r) { return r.length === 4; })
            .map(parseToCourse)
            .value();
    });
    $scope.$watch('mainCtrl.courses', findPossibleSolutions);
    $scope.$watch('mainCtrl.examens', findPossibleSolutions, true);
});
app.filter('levelToString', function () {
    return function (level) {
        return Level[level].toString();
    };
});
