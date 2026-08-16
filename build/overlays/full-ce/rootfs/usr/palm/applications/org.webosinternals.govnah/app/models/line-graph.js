/*

	^ |
	| |
	y |_______
	    x - >
	
	x = left
	y = top

*/

function lineGraph(element, options, labels)
{
	this.element = element;
	this.labels  = labels;
	this.canvas  = this.element.getContext('2d');
	this.options = options || {};
	
	this.options = this.merge(options,
	{
		renderWidth:	480,
		renderHeight:	320,
		xaxis:
		{
			min:		null,
			max:		null
		},
		yaxis:
		{
			min:		null,
			max:		null,
			tics:		false,
			ticStroke:	"rgba(0, 0, 0, .5)",
			ticFill:	false,
			ticWidth:	1,
			ticFormat:	function(n){return n;}
		},
		padding:
		{
			clear:		false,
			top:		0,
			bottom:		0,
			left:		0,
			right:		0
		},
		clearWidth:		1024,
		clearHeight:	1024
	});
	
	this.lines =		[];
	
	this.drawWidth =	0;
	this.drawHeight =	0;
	this.xScale =		0;
	this.yScale =		0;
	
	this.xaxis =
	{
		min:	0,
		max:	0
	}
	this.yaxis =
	{
		min:	0,
		max:	0
	}
	
};
lineGraph.prototype.merge = function(src, dest)
{
	var result = dest || {};
	for(var i in src){		  
		result[i] = (typeof(src[i]) == 'object' && !(src[i].constructor == Array || src[i].constructor == RegExp)) ? this.merge(src[i], dest[i]) : result[i] = src[i];		
	}
	return result;	
};

lineGraph.prototype.addLine = function(line)
{
	if (line)
	{
		var tmpLine = this.merge(line,
		{
			data:	null,
			stroke:	"rgba(0, 0, 0, .5)",
			fill:	null,
			width:	2
		});
		this.lines.push(tmpLine);
	}
};

lineGraph.prototype.clearLines = function()
{
	this.lines = [];
}
lineGraph.prototype.prepareLines = function()
{
	this.xaxis.min = this.yaxis.min = Number.MAX_VALUE;
	this.xaxis.max = this.yaxis.max = Number.MIN_VALUE;
	
	this.lines.each(function(l)
	{
		l.data.each(function(d)
		{
			if (d.x < this.xaxis.min) this.xaxis.min = d.x;
			if (d.x > this.xaxis.max) this.xaxis.max = d.x;
			if (d.y < this.yaxis.min) this.yaxis.min = d.y;
			if (d.y > this.yaxis.max) this.yaxis.max = d.y;
		}.bind(this));
	}.bind(this));
	
	if (this.options.xaxis.min !== null && this.options.xaxis.min < this.xaxis.min) this.xaxis.min = this.options.xaxis.min;
	if (this.options.xaxis.max !== null && this.options.xaxis.max < this.xaxis.max) this.xaxis.max = this.options.xaxis.max;
	if (this.options.yaxis.min !== null && this.options.yaxis.min < this.yaxis.min) this.yaxis.min = this.options.yaxis.min;
	if (this.options.yaxis.max !== null && this.options.yaxis.max < this.yaxis.max) this.yaxis.max = this.options.yaxis.max;
	
	if ((this.yaxis.max - this.yaxis.min) == 0)
	{
		this.yaxis.max++;
		if (this.yaxis.min >= 1) this.yaxis.min--;
	}
	
	this.drawHeight = this.options.renderHeight - (this.options.padding.bottom + this.options.padding.top);
	this.drawWidth = this.options.renderWidth - (this.options.padding.left + this.options.padding.right);
	
	this.xScale = this.drawWidth / (this.xaxis.max - this.xaxis.min);
	this.yScale = this.drawHeight / (this.yaxis.max - this.yaxis.min);
};
lineGraph.prototype.renderTics = function()
{
	this.canvas.strokeStyle = this.options.yaxis.ticStroke;
	this.canvas.fillStyle =   this.options.yaxis.ticFill;
	this.canvas.lineWidth =   this.options.yaxis.ticWidth;
	
	this.yaxis.max = this.getBetterMaxY(this.yaxis.max);
	this.yScale = this.drawHeight / (this.yaxis.max - this.yaxis.min);
	
	var html = '';
	
	var ticsEvery = Math.ceil(this.yaxis.max-this.yaxis.min)/(this.options.yaxis.tics-1);
	
	for (var t = 0; t < this.options.yaxis.tics; t++)
	{
		var v = (t*ticsEvery) + this.yaxis.min;
		var y = this.getY(v);
		if (y >= (0-this.options.padding.top))
		{
			html += '<div style="top: '+y+'px;">'+this.options.yaxis.ticFormat(v)+'</div>';
			
			if (this.options.yaxis.ticStroke !== false)
			{
				this.canvas.beginPath();
				this.canvas.moveTo(this.options.padding.left, y);
				this.canvas.lineTo(this.options.padding.left + this.drawWidth, y);
				this.canvas.stroke();
				this.canvas.closePath();
			}
			if (this.options.yaxis.ticFill !== false && (t%2) && t > 0)
			{
				var y2 = this.getY(((t-1)*ticsEvery) + this.yaxis.min);
				this.canvas.fillRect(this.options.padding.left, y, this.drawWidth, y2-y);
			}
		}
	}
	
	this.labels.update(html);
}
lineGraph.prototype.getBetterMaxY = function(y)
{
	// really, this sucks...
	y = Math.ceil(y);
	while ((y-this.yaxis.min)%(this.options.yaxis.tics-1))
	{
		y++;
	}
	return y;
}

lineGraph.prototype.getX = function(x)
{
	return this.options.padding.left + (x - this.xaxis.min) * this.xScale;
};
lineGraph.prototype.getY = function(y)
{
	return this.options.padding.top + this.drawHeight - (y - this.yaxis.min) * this.yScale;
};

lineGraph.prototype.render = function()
{
  	this.canvas.clearRect(0, 0, this.options.clearWidth, this.options.clearHeight);
	this.canvas.save();
	
	this.prepareLines();
	
	if (this.options.yaxis.tics !== false)
	{
		this.renderTics();
	}
	
	this.lines.each(function(l)
	{
		this.canvas.strokeStyle = l.stroke;
		this.canvas.fillStyle = l.fill;
		this.canvas.lineWidth = l.width;
		//this.canvas.lineJoin = 'round';
		
		this.canvas.beginPath();
		
		var first = false;
		var last = false;
		l.data.each(function(d)
		{
			if (!first)
			{
				this.canvas.moveTo(this.getX(d.x), this.getY(d.y));
				first = d;
			}
			else
			{
				this.canvas.lineTo(this.getX(d.x), this.getY(d.y));
			}
			last = d;
		}.bind(this));
		
		this.canvas.stroke();
		if (l.fill)
		{
			this.canvas.lineTo(this.getX(last.x), this.options.renderHeight);
			this.canvas.lineTo(this.getX(first.x), this.options.renderHeight);
			this.canvas.fill();
		}
		this.canvas.closePath();
		
		//this.canvas.globalCompositeOperation = 'destination-out';
		
	}.bind(this));
	
	
	if (this.options.padding.clear && (this.options.padding.top || this.options.padding.bottom || this.options.padding.left || this.options.padding.right))
	{
		this.canvas.clearRect(0, 0, this.options.renderWidth, this.options.padding.top);
		this.canvas.clearRect(0, 0, this.options.padding.left, this.options.renderHeight);
		this.canvas.clearRect(this.options.renderWidth - this.options.padding.right, 0, this.options.padding.right, this.options.renderHeight);
		this.canvas.clearRect(0, this.options.renderHeight - this.options.padding.bottom, this.options.renderWidth, this.options.padding.bottom);
	}
	
  	this.canvas.restore();
};



// Local Variables:
// tab-width: 4
// End:
