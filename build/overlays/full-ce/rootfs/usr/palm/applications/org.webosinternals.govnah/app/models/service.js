service.identifier = 'palm://org.webosinternals.govnah';

function service(){};

service.getMachineName = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'getMachineName',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};


service.get_proc_version = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_proc_version',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_proc_cpuinfo = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_proc_cpuinfo',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_proc_meminfo = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_proc_meminfo',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_proc_loadavg = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_proc_loadavg',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_omap34xx_temp = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_omap34xx_temp',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_tmp105_temp = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_tmp105_temp',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_a6_temp = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_a6_temp',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_scaling_cur_freq = function(callback, cpu)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_scaling_cur_freq',
		parameters:
		{
			cpu: cpu
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_scaling_governor = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_scaling_governor',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

service.get_cpufreq_params = function(callback, governor, cpu)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_cpufreq_params',
		parameters:
		{
			governor: governor,
			cpu: cpu
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.set_cpufreq_params = function(callback, genericParams, governorParams, overrideParams, maxCpu)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'set_cpufreq_params',
		parameters:
		{
			genericParams: genericParams,
			governorParams: governorParams,
			overrideParams: overrideParams,
			maxCpu: maxCpu
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.stick_cpufreq_params = function(callback, genericParams, governorParams, overrideParams, maxCpu)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'stick_cpufreq_params',
		parameters:
		{
			genericParams: genericParams,
			governorParams: governorParams,
			overrideParams: overrideParams,
			maxCpu: maxCpu
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.unstick_cpufreq_params = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'unstick_cpufreq_params',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_cpufreq_file = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_cpufreq_file',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

service.get_compcache_config = function(callback, governor)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_compcache_config',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.set_compcache_config = function(callback, compcacheConfig)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'set_compcache_config',
		parameters:
		{
			compcacheConfig: compcacheConfig
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.stick_compcache_config = function(callback, compcacheConfig)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'stick_compcache_config',
		parameters:
		{
			compcacheConfig: compcacheConfig
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.unstick_compcache_config = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'unstick_compcache_config',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_compcache_file = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_compcache_file',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

service.get_time_in_state = function(callback, cpu)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_time_in_state',
		parameters:
		{
			cpu: cpu
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_total_trans = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_total_trans',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_trans_table = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_trans_table',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_battery_current = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_battery_current',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_a6_current = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_a6_current',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_io_scheduler = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_io_scheduler',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.set_io_scheduler = function(callback, value)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'set_io_scheduler',
		parameters:
		{
			value: value
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.stick_io_scheduler = function(callback, value)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'stick_io_scheduler',
		parameters:
		{
			value: value
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.unstick_io_scheduler = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'unstick_io_scheduler',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_tcp_available_congestion_control = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_tcp_available_congestion_control',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.get_tcp_congestion_control = function(callback)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'get_tcp_congestion_control',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
service.set_tcp_congestion_control = function(callback, value)
{
	var request = new Mojo.Service.Request(service.identifier,
	{
		method: 'set_tcp_congestion_control',
		parameters:
		{
			value: value
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

// Local Variables:
// tab-width: 4
// End:
