enyo.kind({
	name: "RouteManeuverIcon",
	kind: enyo.Control,
	published: {
		type: ""
	},
	className: "route-maneuver-icon",
	imageHeight: 25,
	typeChanged: function() {
		var ypos = this.getIndexFromManeuverType() * -this.imageHeight;
		this.applyStyle("background-position", "0px " + ypos + "px");
	},
	getIndexFromManeuverType: function() {
		switch (this.type) {
			case "BearLeft":
				return 2;
			case "BearRight":
				return 1;
			case "ExitRoundabout":
				return 12;
			case "KeepLeft":
				return 19;
			case "KeepRight":
				return 20;
			case "KeepStraight":
				return 5;
			case "KeepToStayLeft":
				return 19;
			case "KeepToStayRight":
				return 20;
			case "RampThenHighwayLeft":
				return 6;
			case "RampThenHighwayRight":
				return 7;
			case "RoadNameChange":
				return 5;
			case "TakeRampLeft":
				return 8;
			case "TakeRampRight":
				return 9;
			case "TurnLeft":
				return 3;
			case "TurnRight":
				return 4;
			case "UTurn":
				return 17;
			default:
				return 0;
		};
	}
})
