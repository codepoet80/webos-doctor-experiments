function barGraph(graph, options)
{
	this.graph = graph;
	this.options = options;
	
	this.height = options.height ? options.height : 100;
	this.width = options.width ? options.width : 320;
	
	this.canvas = this.graph.getContext('2d');
	
	this.defaultData =
	{
		strokeStyle: "rgba(0, 0, 0, 1)",
		fillStyle: "rgba(0, 0, 0, .5)",
		lineWidth: 2
	};
	
	this.data = {}; 
	
};

barGraph.prototype.setData = function(data, options)
{
	if (!options.top || !options.bottom)
	{
		var top = 0;
		var bottom = 999999;
		
		for (var d = 0; d < data.length; d++)
		{
			if (data[d] !== false)
			{
				if (top < data[d].value) top = data[d].value;
				if (bottom > data[d].value) bottom = data[d].value;
			}
		}
	}
	
	var tmpData =
	{
		data: data,
		vertical:
		{
			top: options.top ? options.top : top,
			bottom: options.bottom ? options.bottom : bottom
		},
		strokeStyle: options.strokeStyle ? options.strokeStyle : this.defaultData.strokeStyle,
		fillStyle: options.fillStyle ? options.fillStyle : this.defaultData.fillStyle,
		lineWidth: options.lineWidth ? options.lineWidth : this.defaultData.lineWidth,
		barWidth: options.barWidth ? options.barWidth : this.defaultData.barWidth
	};
	
	this.data = tmpData;
}

barGraph.prototype.render = function()
{
  	this.canvas.clearRect(0, 0, this.width, this.height+1);
	this.canvas.save();

	this.canvas.strokeStyle = this.data.strokeStyle;
	this.canvas.fillStyle = this.data.fillStyle;
	this.canvas.lineWidth = this.data.lineWidth;
	
	if (this.data.data.length > 0)
	{
		var barWidth = (this.width / this.data.data.length);
		
		for (var d = 0; d < this.data.data.length; d++)
		{
			var crnt = this.data.data[d];
			if (crnt !== false)
			{
				if (this.data.fillStyle)
				{
					this.canvas.fillRect ((d * barWidth) + 5, this.height - (this.height / (this.data.vertical.top - this.data.vertical.bottom)) * (crnt.value - this.data.vertical.bottom), (barWidth - 10), (this.height + 2));
					this.canvas.fill();
				}
				if (this.data.strokeStyle)
				{
					this.canvas.strokeRect ((d * barWidth) + 5, this.height - (this.height / (this.data.vertical.top - this.data.vertical.bottom)) * (crnt.value - this.data.vertical.bottom), (barWidth - 10), (this.height + 2));
					this.canvas.stroke();
				}
			}
		}
	}
	
  	this.canvas.restore();
};


// Local Variables:
// tab-width: 4
// End:
