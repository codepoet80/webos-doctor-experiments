function helpData()
{
}

helpData.get = function(lookup)
{
	if (helpData.lookup[lookup])
	{
		return helpData.lookup[lookup];
	}
	else
	{
		return { title: lookup.replace(/_/g, " ").replace(/-/g, " "), data: 'This section isn\'t configured in the help model. Call a programmer! ('+lookup+')' };
	}
	return false; // this shouldn't happen
}

helpData.lookup = 
{
	'governor':
	{
		title: $L('Governor'),
		data: $L('A governor is what controls the operating frequency of the kernel in real time. Different governors have different parameters, and each governor is unique in the way that it operates. The governors available depend upon the installed kernel. The standard set of governors available when the UberKernel is installed are:<ul><li><b>ondemand</b> - Increases clock speed in response to increases in CPU load.</li><li><b>conservative</b> - Similar to the ondemand governor. It differs in behaviour in that it gracefully increases and decreases the CPU speed rather than jumping to max speed the moment there is any load on the CPU.</li><li><b>userspace</b> - Sets the CPU speed to a defined rate as chosen by LunaSysMgr.</li><li><b>powersave</b> - Sets the CPU speed to the min frequency value.</li><li><b>performance</b> - Sets the CPU speed to the max frequency value.</li><li><b>screenstate</b> - Runs at a higher speed when the screen is on and a lower speed when the screen is off.</li><li><b>screenstate-v2</b> - Similar to the original screenstate, but includes vdemand, which decreases and increases voltage in response to CPU load. Voltage scaling is done by a factor method; Low - High, in respective to CPU load. </li><li><b>screenstate-v3</b> - Similar to screenstate-v2, but includes ondemand frequency scaling while screen is on. Screenstate-v3 also performs more agressive voltage scaling. The ondemand feature is tuned for interactive response, not ramp-up like original ondemand governor. No voltage scaling is performed when screen is on and ondemand is enabled, it will voltage scale when screen is off only. When ondemand is disabled, full voltage scaling is performed all the time.</li><li><b>vdemand</b> - Sets CPU to max frequency per policy, with added voltage scaling in response to CPU load. No frequency scaling is performed. The minimum frequency parameter is ignored. Voltage scaling parameters are statically set to user preference to suit the characteristics of their phone.</li></ul>Note: Not all governors are available for all kernels. Some kernels are designed to use a specific governor.')
	},
	
	'scheduler':
	{
		title: $L('I/O Scheduler'),
		data: $L('The Linux kernel is responsible for controlling flash memory access by using kernel I/O scheduling. In layman terms it re-orders the incoming randomly ordered requests into a more efficient order for accessing the flash memory storage. This can have varying effects on performance. By default Palm uses the CFQ I/O scheduler however there are some report of better performance when using the Anticipatory I/O scheduler. The standard set of schedulers available when the UberKernel is installed are:<ul><li><b>noop</b> - A simple FIFO queue that uses the minimal amount of CPU/instructions per I/O to accomplish basic merging and sorting functionality.</li><li><b>anticipatory</b> - A controlled delay is introduced before dispatching the I/O to attempt to aggregate and/or re-order requests to improve locality. Using this scheduler may cause higher I/O latency.</li><li><b>deadline</b> - Uses a deadline algorithm to minimize I/O latency for each I/O request. The scheduler provides near real-time behavior and uses a round robin policy to attempt to be fair among multiple I/O requests and to avoid process starvation.</li><li><b>cfq</b> - Completely Fair Queuing maintains a scalable per-process I/O queue and attempts to distribute the available I/O bandwidth equally among all I/O requests.</li></ul>')
	},
	
	'congestion':
	{
		title: $L('TCP Congestion'),
		data: $L('<ul><li><b>TCP Tahoe/Reno</b> - are the classical models used for congestion control. They exhibit the typical slow start of transmissions. The throughput increases gradually until it stays stable. It is decreased as soon as the transfer encounters congestion, then the rate rises again slowly. The window is increased by adding fixed values. TCP Reno uses a multiplicative decrease algorithm for the reduction of window size. TCP Reno is the most widely deployed algorithm.</li><li><b>CUBIC</b> - is a less aggressive variant of BIC (meaning, it doesn\'t steal as much throughput from competing TCP flows as does BIC).</li><li><b>Vegas</b> - emphasizes packet delay, rather than packet loss, as a signal to help determine the rate at which to send packets.</li><li><b>TCP Hybla</b> - aims to eliminate penalization of TCP connections that incorporate a high-latency terrestrial or satellite radio link, due to their longer round trip times.</li><li><b>BIC</b> - uses a unique window growth function. In case of packet loss, the window is reduced by a multiplicative factor. The window size just before and after the reduction is then used as parameters for a binary search for the new window size.</li><li><b>Westwood+</b> - addresses both large bandwidth/RTT values and random packet loss together with dynamically changing network loads. It analyses the state of the transfer by looking at the acknowledgement packets. Westwood+ is a modification of the TCP Reno algorithm.</li><li><b>Highspeed TCP</b> - The main use is for connections with large bandwidth and large RTT (such as Gbit/s and 100 ms RTT).</li><li><b>H-TCP</b> - was proposed by the Hamilton Institute for transmissions that recover more quickly after a congestion event. It is also designed for links with high bandwidth and RTT.</li><li><b>TCP Vegas</b> - introduces the measurement of RTT for evaluating the link quality. It uses additive increases and additive decreases for the congestion window.</li><li><b>YeAH-TCP</b> - is a sender-side high-speed enabled TCP congestion control algorithm, which uses a mixed loss/delay approach to compute the congestion window. It\'s design goals target high efficiency, internal, RTT and Reno fairness, resilience to link loss while keeping network elements load as low as possible.</li><li><b>TCP Veno</b> - is optimised for wireless networks, since it was designed to handle random packet loss better. It tries to keep track of the transfer, and guesses if the quality decreases due to congestion or random packet errors.</li><li><b>Scalable TCP</b> - is another algorithm for WAN links with high bandwidth and RTT. One of its design goals is a quick recovery of the window size after a congestion event. It achieves this goal by resetting the window to a higher value than standard TCP.</li><li><b>TCP-Illinois</b> - uses packet loss information to determine whether the window size should be increased or decreased, and uses queueing delay information to determine the amount of increment or decrement. TCP-Illinois achieves high throughput, allocates the network resource fairly, and is incentive compatible with standard TCP.</li><li><b>TCP Low Priority (lp)</b> - is an approach to develop an algorithm that uses excess bandwidth for TCP flows. It can be used for low priority data transfers without "disturbing" other TCP transmissions (which probably don\'t use TCP Low Priority).</li></ul>Note: Not all TCP congestion controls are available for all kernels.')
	},
	
	
	
	'scaling_min_freq':
	{
		title: $L('Min Frequency'),
		data: $L('This sets the lowest CPU clock speed to which your CPU is allowed to scale. For example: if you set this parameter to 500MHz your device will not scale below that speed. Note that some devices may hang at frequencies below 500MHz.')
	},
	
	'scaling_max_freq':
	{
		title: $L('Max Frequency'),
		data: $L('This sets the highest CPU clock speed to which your CPU is allowed to scale. For example: if you set this parameter to 800MHz your device will not scale above that speed. Note that each device has a unique highest working CPU clock speed, and not all devices will overclock to 1GHz and beyond.')
	},
	
	'scaling_setspeed':
	{
		title: $L('SetSpeed'),
		data: $L('This fixes the CPU clock speed at one frequency. For example: if you set this parameter to 500MHz your device will stay at 500MHz regardless of CPU load or screen state. When using the userspace governor, the LunaSysMgr process will override your speed settings.')
	},
	
	'up_threshold':
	{
		title: $L('Up Threshold'),
		data: $L('This parameter decides how much of the CPU needs to be in use before the CPU speed will be increased. For example: if this value is set to the default setting of 80 the CPU will need to be 80% in use before the kernel will increase the speed of the device.')
	},
	
	'down_threshold':
	{
		title: $L('Down Threshold'),
		data: $L('This parameter decides how much the CPU needs to be in use before the CPU speed will be decreased. For example: if this value is set to 20 the CPU speed will not decrease until it is below 20% in use.')
	},
	
	'freq_step':
	{
		title: $L('Frequency Step'),
		data: $L('This will decide how large or small of a percentage the CPU speed will be increased or decreased. For example: if this value is set to to 5% the CPU speed will be adjusted by 5% at a time. So, if the CPU demands more speed then your speed will jump from 5% to 10% and so on. It will also decrease in 5% increments.')
	},
	
	'sampling_rate':
	{
		title: $L('Sampling Rate'),
		data: $L('This is how often the kernel is set to look at CPU usage to make decisions on how to change the CPU speed. This value is measured in microseconds (one millionth of a second) by default and on average this is set to 10000 or more.')
	},
	
	'sampling_down_factor':
	{
		title: $L('Sampling Down Factor'),
		data: $L('This controls how often the CPU makes the decision to lowers the frequency. For example: if this value is set to 5 the kernel will have to have made the decision to lower frequency 5 times in a row.')
	},
	
	'powersave_bias':
	{
		title: $L('Powersave Bias'),
		data: $L('This parameter is available with the ondemand governor. By changing this parameter you can adjust the performance to power efficiency ratio. This value is set to 0 by default thus maintaining the highest performance to power efficiency ratio. However, there are times when you may want a higher ratio of power efficiency to help with battery savings. It is to be noted that this is for <b>experienced users only</b>.')
	},
	
	'ignore_nice_load':
	{
		title: $L('Ignore Nice Load'),
		data: $L('This parameter only has two values which are 0 and 1. By default it is set to 0 which means that all processes are calculated in CPU usage samples. If this value is set to 1 then all processes that hold a "nice" value will be ignored in the CPU usage samples.')
	},
	
	'io_is_busy':
	{
		title: $L('I/O Is Busy'),
		data: $L('This parameter determines whether waiting for I/O is considered equivalent to CPU load.')
	},
	
	'turbo_mode':
	{
		title: $L('Turbo Mode'),
		data: $L('This toggles full-time dual-core support or default webOS power saving profile.')
	},
	
	'power_saver':
	{
		title: $L('Power Saver'),
		data: $L('This toggles extra power savings features by either turning off dual-core in idle load or reverting to webOS power saving profile.')
	},
	
	'max_tickle_window':
	{
		title: $L('Max Tickle Window'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'max_floor_window':
	{
		title: $L('Max Floor Window'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'compcache_enabled':
	{
		title: $L('Compcache Enabled'),
		data: $L('Compcache provides the possibility of using parts of the memory as virtual compressed memory. This compressed memory is not as quickly accessed as the normal memory. However, it will help with opening up memory intense apps that would otherwise throw an immediate "Too Many Cards" error.')
	},
	
	'compcache_memlimit':
	{
		title: $L('Compcache Memlimit'),
		data: $L('This value is how much of your physical memory that you would like to use for compressed memory. Thus a higher compcache_memlimit will give you the ability to open more cards. However, due to the slow access of the compressed memory you could miss things like phone calls if the compcache_memlimit is set too high as the device can not open the phone app quick enough to catch the call. The value of this parameter is dependent on device platform. Do not set this value high if you do not have enough free available real RAM.')
	},
	
	'vdd':
	{
		title: $L('CPU Voltages'),
		data: $L('These values represent the various voltage levels for each CPU frequency supported by the kernel. Setting this too low can result in a RSOD.')
	},
	
	'vdd1_vsel':
	{
		title: $L('CPU Voltages'),
		data: $L('These values represent the various voltage levels for each CPU frequency supported by the kernel. Setting this too low can result in a RSOD.')
	},
	
	'vdd2_vsel':
	{
		title: $L('System Voltages'),
		data: $L('These values represent the various voltage levels for each System frequency supported by the kernel.  Setting this too low can result in a RSOD or random Luna restarts.')
	},
	
	'cpu_hightemp_reset':
	{
		title: $L('Temp Reset'),
		data: $L('When the CPU cools down to this temperature the CPU frequency will go back the max frequency that the user has set in their profile policy.')
	},
	
	'cpu_hightemp_alarm':
	{
		title: $L('Temp Limit'),
		data: $L('When the CPU reaches this temperature the CPU speed will be clamped to 500MHz until the CPU cools down to a user configurable lower temperature.')
	},
	
	'cpu_hightemp_scaleback_speed':
	{
		title: $L('Temp Scaleback Speed'),
		data: $L('This setting is the frequency the device will be lowered to once the CPU High Temp Alarm has been crossed. For example: by default if the the CPU temp reaches 50C, the CPU speed will be decreased to the default factory stock speed of the device. The scale back speed is dependent on platform.')
	},
	
	'battery_scaleback_percent':
	{
		title: $L('Battery Low Threshold'),
		data: $L('This value represents how low the battery can go before the kernel will lower the CPU speed to conserve battery power. By default this value is set to 20%. Once this threshold is crossed the kernel will lower the CPU frequency.')
	},
	
	'battery_scaleback_speed':
	{
		title: $L('Battery Low Speed'),
		data: $L('This setting is the frequency that the device will be lowered to once the Battery Low Threshold has been crossed. For example: by default if the the battery reaches 20% charge the CPU speed will be decreased to 500MHz to conserve battery power. The scale back speed is dependent on platform.')
	},
	
	'override_charger':
	{
		title: $L('Override Charger'),
		data: $L('By default kernels from WebOS Internals running the screenstate governor will scale back to 500MHz to help maintain a lower temperature while charging. However, if you enable override_charger you will be able to run a faster CPU speed while charging. Note: please monitor you CPU temperature while running a higher than stock frequency during charging.')
	},

	'vdemand_enable':
	{
		title: $L('Enable vDemand'),
		data: $L('Enable or disable vDemand CPU voltage scaling. Enabling this can save battery. This option is only available in Screenstate governors.')
	},

	'vdemand_poll_rate':
	{
		title: $L('vDemand Polling Rate'),
		data: $L('This setting controls how fast the kernel will poll for operating parameters, in milliseconds.  The lower the number the faster the polling. Setting this too low can result in needless CPU cycles wasted.')
	},

	'vdemand_factor':
	{
		title: $L('vDemand Scaling Factor'),
		data: $L('This setting controls the level of voltage scaling the kernel will perform on the CPU in response to CPU load.  A setting of Low will do minimal voltage scaling, a setting of High will do more. Not all devices will perform the same with all factors. Only select OMG if you have a Terminator or Chuck Norris Pre.')
	},

	'charger_override':
	{
		title: $L('Charger Override'),
		data: $L('By default kernels from WebOS Internals running the screenstate governor will scale back to 500MHz to help maintain a lower temperature while charging. However, if you enable charger_override you will be able to run a faster CPU speed while charging. Note: please monitor you CPU temperature while running a higher than stock frequency during charging.')
	},

	'charger_poll_rate':
	{
		title: $L('Charger Polling Rate'),
		data: $L('This setting controls how fast the kernel will check for wether or not a charger is plugged in, in seconds.  The lower the number the faster the polling. The default is fine for most.')
	},

	'ondemand_enable':
	{
		title: $L('Enable Ondemand'),
		data: $L('Enable or disable CPU frequency scaling in the Screenstate-v3 governor. This option also disables vdemand when screen is on, but resumes vdemand when screen is off.')
	},

	'screenstate_enable':
	{
		title: $L('Enable Screenstate'),
		data: $L('Enable or disable Screenstate CPU frequency limiting when screen is off.')
	},

	'screen_off_max_freq':
	{
		title: $L('Screen Off Max Freq'),
		data: $L('This sets the highest CPU clock speed to which your CPU is allowed to scale when Screenstate functionality is enabled and the screen is off.')
	}
};
