/*\
title: $:/plugins/cdr/colorlab/lib/convert.js
type: application/javascript
module-type: library

Color manipulation library

\*/
(function() {
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// given white point in (x,y), returns its XYZ coordinate
function whitepoint(x,y) {return [x/y, 1, (1-x-y)/y];}

function uv(p) {
	return [4*p[0] / (p[0] + 15*p[1] + 3*p[2]), 9*p[1] / (p[0] + 15*p[1] + 3*p[2])];
}

// given an 3x3 matrix M and a vector v, multiple M x v
function matmul(M,v) {
	return v.map(function (e /*not used*/,i,a) {
		return M[i][0]*a[0] + M[i][1]*a[1] + M[i][2]*a[2];
	});
}

var CIE = {
	ε: 216/24389,
	κ: 24389/27,
	ε_cbrt: 6/29,
	illuminant: function(x,y) {
		var wp = whitepoint(x,y);
		return {
			white: Object.freeze(wp),
			uvref: Object.freeze(uv(wp))
		};
	}
};

CIE.D65 = CIE.illuminant(0.3127,0.3290);
CIE.D50 = CIE.illuminant(0.3457,0.3585);

var Convert = {};

function clamp(v,min,max) {
	return Math.min(Math.max(v,min),max);
}

function clamp360(v) {
	return  ((v % 360) + 360) % 360;
}

Convert.clamp = clamp;
Convert.clamp360 = clamp360;

Convert.spaces = {};

Convert.spaces.xyz = {
	id: "xyz",
	name: "XYZ",
	coords: [{name:"X",range:[-Infinity,Infinity]},
	         {name:"Y",range:[-Infinity,Infinity]},
	         {name:"Z",range:[-Infinity,Infinity]}],
	white: CIE.D65.white,

	fromXYZ: function(xyz) {return xyz;},
	toXYZ:   function(xyz) {return xyz;},

	toString: function(xyz,alpha) {
		return "xyz(" + numstr(lch[0])
			+ numstr(xyz[1]) + " " 
			+ numstr(xyz[2])+ appendAlpha(alpha) + ")";
	}
}

Convert.spaces.rgb = {
	id: "rgb",
	name: "sRGB",
	coords: [{name:"r",range:[0,1]},
	         {name:"g",range:[0,1]},
	         {name:"b",range:[0,1]}],
	white: CIE.D65.white,
	intoGamut: true,

	// extended transfer function: if x < 0, returns -f(-x)
	toLinear: function(rgb) {
		function invCompand(c) {
			var sign = c < 0 ? -1 : 1;
			c = Math.abs(c);
			return sign * (c  <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4));
		}

		// expand gamma correction
		return rgb.map(invCompand);
	},

	// extended transfer function: if x < 0, returns -f(-x)
	toGamma: function(lrgb) {
		function compand(c) {
			var sign = c < 0 ? -1 : 1;
			c = Math.abs(c);
			return sign * (c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c,5/12)-0.055);
		}
		// compress linear rgb with gamma correction
		return lrgb.map(compand)
	},

	// sRGB to xyz
	toXYZ: (function() {
		// computed from white point
		var M = [[0.4123907992659595, 0.357584339383878 , 0.1804807884018343],
		         [0.2126390058715103, 0.7151686787677559, 0.0721923153607337],
		         [0.0193308187155918, 0.1191947797946259, 0.9505321522496605]];
		return function(rgb) {
			return matmul(M,this.toLinear(rgb));
		}   
	})(),

	// xyz to sRGB
	fromXYZ: (function() {
		var M = [[ 3.240969941904522 , -1.5373831775700937, -0.4986107602930033],
		         [-0.9692436362808798,  1.8759675015077206,  0.0415550574071756],
		         [ 0.0556300796969936, -0.2039769588889765,  1.0569715142428786]];
		return function(xyz) {
			return this.toGamma(matmul(M,xyz));
		}
	})(),

	toString: function(coords,alpha) {
		var rgb = coords.map(function(x) {return Math.round(x*255);});

		if (alpha < 1) {
			return "rgba(" + rgb.join(",") + "," + numstr(alpha) + ")";
		} else {
			return "rgb(" + rgb.join(",") + ")";
		}
	}
};

Convert.spaces.p3 = {
	id: "p3",
	name: "display-p3",
	coords:	[{name:"r",range:[0,1]},
	         {name:"g",range:[0,1]},
	         {name:"b",range:[0,1]}	],
	white: CIE.D65.white,
	intoGamut: true,

	toLinear: Convert.spaces.rgb.toLinear,

	toGamma: Convert.spaces.rgb.toGamma,
 
	toXYZ: (function() {
		// computed from white point
		var M = [[0.486570948648216,  0.2656676931690931, 0.1982172852343625],
		         [0.2289745640697487, 0.6917385218365063, 0.079286914093745 ],
		         [0,                  0.0451133818589026, 1.0439443689009757]];
		return function(rgb) {
			return matmul(M,this.toLinear(rgb));
		}   
	})(),

	fromXYZ: (function() {
		var M = [[ 2.4934969119414263, -0.9313836179191244, -0.4027107844507171],
		         [-0.8294889695615749,  1.7626640603183465,  0.0236246858419436],
		         [ 0.0358458302437845, -0.0761723892680418,  0.9568845240076874]];
		return function(xyz) {
			return this.toGamma(matmul(M,xyz));
		}
	})(),

	toString: function(coords,alpha) {
		coords = coords.map(function(c) {return numstr(c);});
		return "color(display-p3 " + coords.join(" ") + appendAlpha(alpha) + ")";
	}
};

Convert.spaces.lab = {
	id: "lab",
	name: "Lab",
	coords:	[{name:"l",range:[0,100]},
	         {name:"a",range:[-Infinity,Infinity]},
	         {name:"b",range:[-Infinity,Infinity]} ],
	white: CIE.D50.white,

	toXYZ: function(lab) {
		var f=[];
	
		f[1] = (lab[0] + 16)/116;
		f[0] = lab[1]/500 + f[1];
		f[2] = f[1] - lab[2]/200;
	
		var xyz = f.map(function(value,i) {
			var cubed = value * value * value;
			return (cubed > CIE.ε ? cubed : (value * 116 - 16) / CIE.κ) * this.white[i];
		},this);
	
		if (this.white != Convert.spaces.xyz.white) {
			xyz = Convert.chromaticAdaptation(this.white,Convert.spaces.xyz.white,xyz);
		}
		return xyz;
	},

	fromXYZ: function(xyz) {
		if (this.white != Convert.spaces.xyz.white) {
			xyz = Convert.chromaticAdaptation(Convert.spaces.xyz.white,this.white,xyz);
		}

		xyz = xyz.map(function(value,i) {
			return value / this.white[i];
		},this);
	
		var f = xyz.map(function(value,i) {
			return value > CIE.ε ? Math.cbrt(value) : (CIE.κ * value + 16)/116;
		});
	
		return [
			clamp((116 * f[1]) - 16,0,100), // L
			500 * (f[0] - f[1]), // a
			200 * (f[1] - f[2])  // b
		]; 
	},

	toString: function(lab,alpha) {
		return "lab(" + numstr(lab[0]) * 100 + "% " 
			+ numstr(lab[1]) + " " 
			+ numstr(lab[2]) + appendAlpha(alpha) + ")";
	}
}

/* https://www.magnetkern.de/srlab2.pdf */
Convert.spaces.srlab2 = {
	id: "srlab2",
	name: "SRLAB2",
	coords: [{name: "l", range:[0,100]},
	         {name: "a", range:[-Infinity, Infinity]},
			 {name: "b", range:[-Infinity, Infinity]}],
	white: CIE.D65.white,

	fromXYZ: (function() {
		// M_HPE * inv(M_CAT02) * diagonal(1/rgb_ref) * M_CAT02
		var M1 = [
			[ 0.4239866073983792,  0.6933061285086612, -0.0884036796338899],
			[-0.203631183252087 ,  1.1536283980317619,  0.0366500922424727],
		    [-0.0007593175873917, -0.0010007075130392,  0.919806506785842 ]];
		var inv_M_HPE = [
			[ 1.910196834052035 , -1.1121238927878747,  0.2019079567674994],
			[ 0.3709500882486886,  0.6290542573926132, -0.0000080551421844],
			[ 0.                ,  0.                ,  1.                ]];
		var f = function(w) {
			return w <= CIE.ε ? w * 0.01 * CIE.κ  : 1.16 * Math.cbrt(w) - 0.16;
		}

		return function(xyz) {
			xyz = matmul(M1,xyz).map(f);
			xyz = matmul(inv_M_HPE,xyz);
			var L = 100 * xyz[1],
			    a = 500/1.16 * (xyz[0] - xyz[1]),
				b = 200/1.16 * (xyz[1] - xyz[2]);

			return [L,a,b];
		}
	})(),

	toXYZ: (function() {
		// M_HPE * inv(M_CAT02) * diagonal(1/rgb_ref) * M_CAT02
		var M_HPE = [
			[ 0.38971,  0.68898, -0.07868],
			[-0.22981,  1.18340,  0.04641],
			[ 0.00000,  0.00000,  1.0000]];
		var inv_M1 = [
			[ 1.8306560666900926, -1.099994712882931 ,  0.2197762666838433],
			[ 0.3230766443179263,  0.6726717504705783,  0.0042483744450524],
			[ 0.001862733695097 , -0.0001762301699639,  1.0873712286074086]];
		var f = function(w) {
			return w <= 0.08 ? w * 100 / CIE.κ : Math.pow((w + 0.16)/1.16,3);
		}

		return function(lab) {
			var y = 0.01 * lab[0],
			    x = lab[1] * 1.16/500 + y,
				z = y - lab[2] * 1.16/200;
			
			var xyz = matmul(M_HPE,[x,y,z]);
			xyz = matmul(inv_M1,xyz.map(f));

			return xyz;
		}
	})(),

	from: {
		"rgb": function(rgb) {
			var linRGB = Convert.spaces.rgb.toLinear(rgb),
			    x = 0.3205631863289935 * linRGB[0] + 0.6369045416942921 * linRGB[1] + 0.0425422719767143 * linRGB[2],
			    y = 0.1620392455748646 * linRGB[0] + 0.7565920747424774 * linRGB[1] + 0.0813686796826581 * linRGB[2],
			    z = 0.0172546877985969 * linRGB[0] + 0.1086489392821993 * linRGB[1] + 0.8740963729192033 * linRGB[2];

			x = x <= 216/24389 ? x * 24389 / 2700 : 1.16 * Math.cbrt(x) - 0.16;
			y = y <= 216/24389 ? y * 24389 / 2700 : 1.16 * Math.cbrt(y) - 0.16;
			z = z <= 216/24389 ? z * 24389 / 2700 : 1.16 * Math.cbrt(z) - 0.16;

			var lightness =    37.0950 * x +  62.9054 * y -   0.0008 * z;
			var a         =   663.4684 * x - 750.5078 * y +  87.0328 * z;
			var b         =    63.9569 * x + 108.4576 * y - 172.4152 * z;

			return [lightness,a,b];
		}
	},

	to: {
		"rgb": function(lab) {
			var x = 0.01 * lab[0] + 0.000904127 * lab[1] + 0.000456344 * lab[2];
			var y = 0.01 * lab[0] - 0.000533159 * lab[1] - 0.000269178 * lab[2];
			var z = 0.01 * lab[0]                        - 0.005800000 * lab[2];
			if (x <= 0.08) x *= 2700 / 24389;
			else x = Math.pow((x + 0.16) / 1.16,3);
			if (y <= 0.08) y *= 2700 / 24389;
			else y = Math.pow((y + 0.16) / 1.16,3);
			if (z <= 0.08) z *= 2700 / 24389;
			else z = Math.pow((z + 0.16) / 1.16,3);

			var rd =  5.435479909003638  * x - 4.599116163648537  * y + 0.1635818998458092 * z;
			var gn = -1.1681930516161254 * x + 2.32806589521468   * y - 0.1598611616680385 * z;
			var bl =  0.0379082079460666 * x - 0.1985886018050641 * y + 1.1606800147769185 * z;

			return Convert.spaces.rgb.toGamma([rd,gn,bl]);
		}
	},
}

/* https://bottosson.github.io/posts/oklab/ */
Convert.spaces.oklab = {
	id: "oklab",
	name: "Oklab",
	coords: [{name:"l",range:[0,100]},
	         {name:"a",range:[-Infinity,Infinity]},
	         {name:"b",range:[-Infinity,Infinity]} ],
	white: CIE.D65.white,
	
	_lms2lab: (function() {
		var M2 = [[ 0.2104542553,  0.7936177850, -0.0040720468],
		          [ 1.9779984951, -2.4285922050,  0.4505937099],
		          [ 0.0259040371,  0.7827717662, -0.8086757660]];
		return function(lms) {
			lms[0] = Math.cbrt(lms[0]);
			lms[1] = Math.cbrt(lms[1]);
			lms[2] = Math.cbrt(lms[2]);
		
			var lab = matmul(M2,lms);
			lab[0] = clamp(lab[0] * 100,0,100);
			return lab;
		};
	})(),
   
	_lab2lms: (function() {
		var M2inv = [[ 1,  0.3963377921737677,  0.2158037580607588],
		             [ 1, -0.1055613423236563, -0.0638541747717059],
		             [ 1, -0.0894841820949657, -1.2914855378640917]];
		return function(lab) {
			lab = lab.slice(0);
			lab[0] /= 100;
			var lms = matmul(M2inv,lab);

			lms[0] = Math.pow(lms[0],3);
			lms[1] = Math.pow(lms[1],3);
			lms[2] = Math.pow(lms[2],3);
			return lms;
		};
	})(),

	toXYZ: (function() {
		var M1inv = [[ 1.2270138511035211, -0.5577999806518222,  0.2812561489664678],
		             [-0.0405801784232806,  1.11225686961683  , -0.0716766786656012],
		             [-0.0763812845057069, -0.4214819784180127,  1.5861632204407947]];
		return function(lab) {
			var lms = this._lab2lms(lab);

			return matmul(M1inv,lms);
		}
	})(),

	fromXYZ: (function() {
		var M1 = [[ 0.8189330101, 0.3618667424, -0.1288597137],
		          [ 0.0329845436, 0.9293118715,  0.0361456387],
		          [ 0.0482003018, 0.2643662691,  0.6338517070]];
		return function(xyz) {
			var lms = matmul(M1,xyz);

			return this._lms2lab(lms);
		}
	})(),

	from: {
		"rgb": (function() {
			var M = [[ 0.4122214708, 0.5363325363, 0.0514459929],
			         [ 0.2119034982, 0.6806995451, 0.1073969566],
			         [ 0.0883024619, 0.2817188376, 0.6299787005]];
			return function(rgb) {
				var linRGB = Convert.spaces.rgb.toLinear(rgb),
					lms = matmul(M,linRGB);
				return this._lms2lab(lms);
			}
		})()
	},

	to: {
		"rgb": (function() {
			var Minv = [[ 4.0767416621, -3.3077115913,  0.2309699292],
			            [-1.2684380046,  2.6097574011, -0.3413193965],
			            [-0.0041960863, -0.7034186147,  1.7076147010]];
			return function(lab) {
				var lms = this._lab2lms(lab),     
					linRGB = matmul(Minv,lms);
				return Convert.spaces.rgb.toGamma(linRGB);
			};
		})()
	},

	toString: function(lab,alpha) {
		return "oklab(" + numstr(lab[0]) * 100 + "% " 
			+ numstr(lab[1]) + " " 
			+ numstr(lab[2]) + appendAlpha(alpha) + ")";
	}
}

Convert.spaces.luv = {
	id: "luv",
	name: "Luv",
	coords: [{name:"l",range:[0,100]},
	         {name:"u",range:[-Infinity,Infinity]},
	         {name:"v",range:[-Infinity,Infinity],isAngle:true} ],
	white: CIE.D65.white,
	uvref: CIE.D65.uvref,

	toXYZ: function(luv) {
		if (luv[0] === 0) {
			return [0,0,0];
		}
		
		var L = luv[0],u = luv[1],v = luv[2];
		var u0 = this.uvref[0];
		var v0 = this.uvref[1];
	
		var u1 = u / (13 * L) + u0;
		var v1 = v / (13 * L) + v0;
		var d  = 4 * v1;
	
		var y = (L > CIE.κ * CIE.ε) ? Math.pow((L + 16) / 116,3) : L / CIE.κ;
		var x = 9 * y *  u1 / d;
		var z = y * (12 - 3 * u1 - 20 * v1) / d;
	
		return [x,y,z];  
	},

	fromXYZ: function(xyz) {
		var uR = this.uvref[0];
		var vR = this.uvref[1];
	
		var denom = xyz[0] + 15*xyz[1] + 3*xyz[2];
		if (denom === 0) {
			return [0,0,0];
		}
		var u1 = 4 * xyz[0] / denom;
		var v1 = 9 * xyz[1] / denom;
		
		var yR = xyz[1]; // (Yr = 1)
		var l = yR > CIE.ε ? 116*Math.cbrt(yR) - 16 : CIE.κ * yR;
	
		var u =  13 * l * (u1 - uR);
		var v =  13 * l * (v1 - vR);

		return [l,u,v]; 
	},

	toString: function(luv,alpha) {
		return "luv(" + numstr(luv[0]) * 100 + "% "
			+ numstr(luv[1]) + " "
			+ numstr(luv[2]) + appendAlpha(alpha) + ")";
	}
}

// sets the color space from which lch is derived
function defineLCH(nickname,base) {


	var space = {}

	space.coords = _lch.coords;
	space.toString = _lch.toString;

	space.id = nickname;
	space.name = "LCH(" + base.id + ")";
	space.white = base.white;
	space.from = {}
	space.from[base.id] = toLCH;
	space.to = {}
	space.to[base.id] = toCartesian;
	Convert.spaces[space.id] = space;
}

(function() {
	var lch = {
		coords: [{name:"l",range:[0,100]},
				 {name:"c",range:[0,Infinity]},
				 {name:"h",range:[0,360],isAngle:true}],
	
		toString: function(lch,alpha) {
			return "lch(" + numstr(lch[0]) + "% " 
			+ numstr(lch[1]) + " " 
			+ numstr(lch[2]) + appendAlpha(alpha) + ")";
		}
	};

	var defineLCH = function(nickname,base) {
		var space = {}
	
		space.coords = lch.coords;
		space.toString = lch.toString;
	
		space.id = nickname;
		space.name = "LCH(" + base.id + ")";
		space.white = base.white;
		space.from = {}
		space.from[base.id] = toLCH;
		space.to = {}
		space.to[base.id] = toCartesian;
		Convert.spaces[space.id] = space;
	}

	defineLCH("lchab",Convert.spaces.lab);
	defineLCH("lchok",Convert.spaces.oklab);
	defineLCH("lchuv",Convert.spaces.luv);
	defineLCH("lchsr",Convert.spaces.srlab2);
})();

// set default lch space
Convert.spaces.lch = Convert.spaces.lchsr;

// Convert Lab / Luv to cylindrical coord [lightness, chroma, hue]
function toLCH(tuple) {
	var l = tuple[0],
	    a = tuple[1],
	    b = tuple[2];
	var c = Math.sqrt(a*a + b*b);
	var h;

	if (c <= 0.0001) {
		c = 0;
		h = 0; //NaN;
	} else {
		h = Math.atan2(b,a) * 180 / Math.PI; // convert to degrees
	}

	return [clamp(l,0,100), c, clamp360(h)];
}

// Convert from cylindrical coord [lightness (l), chroma, hue] to cartesian coord .
function toCartesian(lch) {
	var l = lch[0], c = lch[1], h = lch[2];

	if (isNaN(h)) {
		h = 0;
	} else {
		h = h * Math.PI / 180; // convert to radians
	}

	var a = c * Math.cos(h);
	var b = c * Math.sin(h);
	return [clamp(l,0,100), a, b]; 
}

// Color space representation adapted from:
// https://github.com/LeaVerou/color.js/blob/master/src/color.js
Object.keys(Convert.spaces).forEach(function(spaceId) {
	var space = Convert.spaces[spaceId];
	console.assert(spaceId === "lch" || spaceId === space.id);
	if (!space.fromXYZ && !space.toXYZ) {
		// add connection space if a space is missing to/from XYZ()
		var connectionSpace;

		if (space.from && space.to) {
			var from = new Set(Object.keys(space.from)),
			    to = new Set(Object.keys(space.to)),
				candidates = [];

			from.forEach(function(id) {
				if (to.has(id)) {
					var sp = Convert.spaces[id];
					if (sp && sp.fromXYZ && sp.toXYZ) {
						candidates.push(id);
					}
				}
			});

			if (candidates.length > 0) {
				connectionSpace = Convert.spaces[candidates[0]];
			}
		}

		if (connectionSpace) {
			// define from/to XYZ functions based on the connection space
			Object.assign(space,{
				fromXYZ: function(xyz) {
					var newCoords = connectionSpace.fromXYZ(xyz);
					return this.from[connectionSpace.id].call(this,newCoords);
				},
				toXYZ: function(coords) {
					var newCoords = this.to[connectionSpace.id].call(this,coords);
					return connectionSpace.toXYZ(newCoords);
				}
			});

			// add connection space's to/from functions as well, e.g.
			// add lab.from to lch's from property
			if (connectionSpace.from) { // e.g. lab.from=rgb
				Object.keys(connectionSpace.from).forEach(function(id) {
					space.from[id] = function(tuple) {
						var newCoords = connectionSpace.from[id].call(connectionSpace,tuple);
						return this.from[connectionSpace.id].call(this,newCoords);
					}
				});
			}
			if (connectionSpace.to) {
				Object.keys(connectionSpace.to).forEach(function(id) {
					space.to[id] = function(tuple) {
						var newCoords = this.to[connectionSpace.id].call(this,tuple);
						return connectionSpace.to[id].call(connectionSpace,newCoords);
					}
				});
			}
		} else {
			throw new ReferenceError("No connection space found for " + space.name + ".");
		}
	}
	Object.assign(space,{
		clip: function(coords) {
			return clip.call(this,coords);
		}
	});
});

// map coords to new space WITHOUT forcing into gamut
Convert.map = function(fromSpace,coords,toSpace) {
	if (fromSpace === toSpace) {
		// Same space, no change needed
		return coords.slice(0);
	}

	// Use direct to/from if available; otherwise, go through xyz space.
	// Custom function takes care any chromatic adaptation and gamut
	// mapping.
	if (toSpace.from && toSpace.from[fromSpace.id]) {
		return toSpace.from[fromSpace.id].call(toSpace,coords);
	}

	if (fromSpace.to && fromSpace.to[toSpace.id]) {
		return fromSpace.to[toSpace.id].call(fromSpace,coords);
	}

	var xyz = fromSpace.toXYZ(coords);

	return toSpace.fromXYZ(xyz);
}

Convert.chromaticAdaptation = function(from,to,xyz) {
	var M;

	// computed
	if (from === CIE.D65.white && to === CIE.D50.white) {
		M = [[ 1.0479297925449966,  0.0229468706016096, -0.0501922662892052],
		     [ 0.0296278087700558,  0.9904344267538798, -0.0170737990634188],
		     [-0.0092430406462045,  0.0150551914902981,  0.7518742814281371]];
	} else if (from === CIE.D50.white && to === CIE.D65.white) {
		M = [[ 0.9554734214880753, -0.0230984549487646, 0.0632592432005706],
		     [-0.0283697093338637,  1.0099953980813041, 0.0210414411919173],
		     [ 0.012314014864482 , -0.020507649298899 , 1.3303659262421237]];
	} else {
		throw new TypeError("Only Bradford Chromatic Adaptation with white points D50 and D65 are supported.");
	}
	return matmul(M,xyz);
}

// check each coordinate in <coords> are within the bounds
Convert.isInSpace = function(space,coords) {
	if (typeof space === "string") {
		space = Convert.getSpace(space)
	}
	
	var isInSpace = coords.every(function(v,i) {
		var epsilon = .00005;
		var min = space.coords[i].range[0];
		var max = space.coords[i].range[1];
		return v >= min - epsilon && v <= max + epsilon;
	});

	if (isInSpace) {
		space.clip(coords); 
	}
	return isInSpace;
}

Convert.getSpace = function(spaceID) {
	if (! Convert.spaces.hasOwnProperty(spaceID)) {
		throw new TypeError("unknown color space: " + spaceID);
	}
	return Convert.spaces[spaceID];
}

// clips components of coords to valid range; padd missing members to zero.
function clip(coords) {
	var space = this;

	space.coords.forEach(function(c,i) {
		if (i >= coords.length) {
			coords[i] = 0;
		} else if (c.isAngle) {
			coords[i] = clamp360(coords[i]);
		} else {
			coords[i] = clamp(coords[i],c.range[0],c.range[1]);
		}
	});
	coords.splice(space.coords.length);
	return coords;
}

// 3-digit precision
function numstr(n) {
	if (isNaN(n)) {
		return "0";
	}
	return (Math.round(n*1000)/1000).toString();
}

function appendAlpha(a,join) {
	return a < 1 ? " / " + numstr(a) : "";
}

module.exports = Convert;
})();
