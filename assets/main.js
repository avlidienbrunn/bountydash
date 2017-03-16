var list = [], selected_tag = false, all_tags = {idx:{},tags:[]}, month_range = -1;
init()
function init() {
	month_range = parseInt(localStorage.getItem('month_range')) || -1;
	$('.js-month-selector').val(month_range);
	$.get('load.php', parse_list);
}
function parse_list(data) {
	all_tags = {idx:{},tags:[]}
	list = data.list;
	set_list();
}
function set_list() {
	$('#list').html('');
	var check_date = new Date();
	check_date.setMonth(check_date.getMonth()-month_range)
	for(key in list) {
		val = list[key];
		tags = val['tags'].join(' ') + ' ';
		val['tags'].forEach(
			function(tag){ 
				if(all_tags.idx[tag] === undefined) {
					idx = all_tags.tags.length;
					all_tags.idx[tag] = idx;
					all_tags.tags[idx] = tag;
				}
			}
		)
		var report_date = val.date.split('T')[0];
		hide = false;
		if(selected_tag) {
			if(tags.indexOf(selected_tag + ' ') == -1) hide = true;
		}
		outdated = false;
		if(month_range > 0) {
			report_date_obj = new Date(report_date);
			if(report_date_obj < check_date) { 
				hide = true;
				outdated = true;
			}
		}
		
		row = $("<tr>").attr('data-id', key).attr('data-tags', tags)
			.append($('<td>').text(val['id'].substr(0,10)))
			.append($('<td>').text(1?val['title']:'#### ## ####'))
			.append($('<td>').text(val['program']))
			.append($('<td class="text-right">').attr('val', val['amount']).text(val['amount'].replace(/\.0?0$/,'')+' '+val['currency']))
			.append($('<td nowrap>').text(val['date'].split('T')[0]))
			.append(
				tags=$('<td>'),
				tags.append(
				val['tags'].forEach(
					function(tag){
						$(tags)
						.append($('<a class="label label-default js-tag">').attr('data-tag', tag).text(tag))
						.append(' ')
					}
				),
				tags.append($('<button class="js-add-tag btn btn-xs btn-link">').text('...'))
				)
			)
		if(outdated) row.addClass('outdated');
		if(hide) row.hide();
		$('#list').append(row);
	}
	select_tag();
}
function select_tag(tag) {
	if(typeof tag == "undefined") tag = false
	if(tag) {
		if(selected_tag) {
			$('.js-tag[data-tag="' + selected_tag + '"]').removeClass('label-warning')
			$('#list tr:not(.outdated)').show()
			if(selected_tag == tag) {
				selected_tag = false
				tag = false;
			}
		}
		if(tag) selected_tag = tag;
	}
	stats()
	if(selected_tag) {
		$('#list tr').not('tr[data-tags*="' + selected_tag + ' "]').hide()
		$('.js-tag[data-tag="' + selected_tag + '"]').addClass('label-warning')
	}
}
function stats() {
	$('#stats-year,#stats-company,#stats-tag').html('');
	years = [];
	total = {amount:0,reports:0,currency:'USD'}
	programs = []
	tags = []
	months = []
	first_report = -1
	months_total = 0;
	var check_date = new Date();
	check_date.setMonth(check_date.getMonth()-month_range)

	for(key in list) {
		val = list[key]
		item_tags = list[key].tags.join(' ')+' ';
		if(selected_tag) {
			if(item_tags.indexOf(selected_tag + ' ') == -1) continue;
		}
		var report_date = val.date.split('T')[0];

		if(first_report == -1 || report_date < first_report) first_report = report_date;

		if(month_range > 0) {
			report_date_obj = new Date(report_date);
			if(report_date_obj < check_date) continue;
		}

		currency = val['currency']
		program = val['program']
		amount = parseFloat(val['amount'])
		year = val['date'].split('-')[0]

		// fill year
		id = year;
		if(!years[id]) years[id] = {year:id,reports:0,amount:0,currency:currency}
		years[id].reports++
		years[id].amount += amount

		// fill programs
		id = program;
		if(!programs[id]) programs[id] = {program:id,reports:0,amount:0,currency:currency}
		programs[id].reports++
		programs[id].amount += amount

		// fill tags
		for(tag_key in list[key].tags) {
			id = list[key].tags[tag_key]
			if(!tags[id]) tags[id] = {tag:id,reports:0,amount:0,currency:currency}
			tags[id].reports++
			tags[id].amount += amount
		}

		//building months
		id = report_date.substring(0, report_date.length-3);
		if(!months[id]) months[id] = {month:id,reports:0,amount:0,currency:currency}
		months[id].reports++
		months[id].amount += amount

		// fill total
		total.reports++
		total.amount += amount

	}

	// get real months for the range
	range = month_range;
	if(range == -1) range = months_ago(first_report) + 1;

	var start_month = new Date();
	start_month.setMonth(start_month.getMonth()-range)

	var end_month = new Date();
	var month_array = get_month_array(start_month.toISOString().split('T')[0], end_month.toISOString().split('T')[0]);
	month_new = [];
	// now hook data to the range, fill it with 0 for the ones not having anything
	for(key in month_array) {
		month = month_array[key];
		month = month.substring(0, month.length-3);
		if(months[month]) 
			month_new[month_new.length] = months[month];
		else
			month_new[month_new.length] = {month:month,reports:0,amount:0,currency:"USD"}
	}
	months = month_new;

	set_chart('js-time-chart', months, "month", 'Rewards / month')

	years.reverse();

	for(year in years) {
		months_total++;
		//year year year
		if(new Date().getFullYear() == years[year].year){
			months_amount = new Date().getMonth()+1;
		}else{
			months_amount = 12;
		}
		years[year].months_amount = months_amount
		val = years[year]
		avg = Math.round(parseFloat(val.amount) / val.reports);
		avg_year = Math.round(parseFloat(val.amount / years[year].months_amount));
		years[year].avg_year = avg_year;
		amount = Math.round(parseFloat(val.amount));
		row = $("<tr>")
			.append($('<td>').text(val['year']))
			.append($('<td>').text(val['reports']))
			.append($('<td>').text(amount+' '+val['currency']))
			.append($('<td>').text(avg))
			.append($('<td id="avg_year_'+years[year].year+'">').text(avg_year))
		$('#stats-year').append(row);
	}

	years.reverse();
	prev_avg_year = 0;
	for(year in years){
		avg_year = years[year].avg_year;
		if(prev_avg_year == 0){
			$("#avg_year_"+years[year].year).attr("title", "0%");
			prev_avg_year = avg_year;
		}else{
			console.log(avg_year + "-" +prev_avg_year + "/" + prev_avg_year + "*100");
			diff = ((avg_year-prev_avg_year)/prev_avg_year * 100).toFixed(2);
			console.log(diff);
			if(diff > 0){
				diff = "+"+diff
			}
			$("#avg_year_"+years[year].year).attr("title", diff+"%");
			prev_avg_year = avg_year;
		}
	}

	if(typeof year !== 'undefined') {
		avg = Math.round(parseFloat(total.amount) / total.reports)
		avg_year = Math.round(parseFloat(val.amount / months_total))
		amount = Math.round(parseFloat(total.amount))
		row = $("<tr>")
			.append($('<td>').text('Total'))
			.append($('<td>').text(total['reports']))
			.append($('<td>').text(amount+' '+total['currency']))
			.append($('<td>').text(avg))
			.append($('<td>').text(avg_year))
		$('#stats-year').append(row);
	}

	new_arr = []
	for(program in programs) {
		new_arr[new_arr.length] = programs[program];
	}
	programs = new_arr;

	programs.sort(function(a, b) { 
	    return b.amount - a.amount;
	})

	programs = programs.splice(0, 5);

	for(program in programs) {
		val = programs[program]
		avg = Math.round(parseFloat(val.amount) / val.reports)
		amount = Math.round(parseFloat(val.amount))
		row = $("<tr>")
			.append($('<td>').text(val.program))
			.append($('<td>').text(val['reports']))
			.append($('<td>').text(amount+' '+val['currency']))
			.append($('<td>').text(avg))
		$('#stats-company').append(row);
	}

	new_arr = []
	for(tag in tags) {
		new_arr[new_arr.length] = tags[tag];
	}
	tags = new_arr;

	tags.sort(function(a, b) { 
	    return b.amount - a.amount;
	})

	tags = tags.splice(0, 10);

	for(tag in tags) {
		val = tags[tag]
		avg = Math.round(parseFloat(val.amount) / val.reports)
		amount = Math.round(parseFloat(val.amount))
		row = $("<tr>")
			.append($('<td>').text(val.tag))
			.append($('<td>').text(val.reports))
			.append($('<td>').text(amount+' '+val.currency))
			.append($('<td>').text(avg))
		$('#stats-tag').append(row);
	}

	tags = $('#tags');
	tags.html('')
	all_tags.tags.sort()
	all_tags.tags.forEach(
		function(tag){
			$(tags)
			.append($('<a class="label label-default js-tag">').attr('data-tag', tag).text(tag))
			.append(' ')
		}
	)
}
function months_ago(check) {
	var d1 = new Date(check);
	var d2 = new Date();
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}
function get_week(d) {
	d = new Date(d);
	d.setHours(0,0,0,0);
	d.setDate(d.getDate() + 4 - (d.getDay()||7));
	var yearStart = new Date(d.getFullYear(),0,1);
	var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
	var monthNo = (d.getMonth()+1); monthNo = (monthNo < 10?'0':'') + monthNo;
	return d.getFullYear() + '-' + monthNo;
}
function get_month_array(startDate, endDate) {
	var start = startDate.split('-'), end = endDate.split('-');
	var startYear = parseInt(start[0]), endYear = parseInt(end[0]);
	var dates = [];
	for(var i = startYear; i <= endYear; i++) {
		var endMonth = i != endYear ? 11 : parseInt(end[1]) - 1;
		var startMon = i === startYear ? parseInt(start[1])-1 : 0;
		for(var j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j+1) {
			var month = j+1;
			var displayMonth = month < 10 ? '0' + month : month;
			dates.push([i, displayMonth, '01'].join('-'));
		}
	}
	return dates;
}
function set_chart(id, data, keyname, title) {
	vals = []
	keys = []
	data.forEach(function(value, key) {
		vals[vals.length] = Math.round(value.amount);
		keys[keys.length] = value[keyname]
	});
	var config = {
        type: 'line',
        data: {
            datasets: [{
                data: vals,
            }],
            labels: keys
        },
        options: {
            responsive: true,
            legend: { display:false },
            title: { display: true, text: title },
            animation: { animateScale: true, animateRotate: true },
			tooltips: {
				mode: 'index', intersect: false,
				callbacks: {
                    label: function(tooltipItems, data) { 
                        return '$' + Number(tooltipItems.yLabel).toFixed(2).replace('.',',');
                    }
                }
			},
			hover: { mode: 'nearest', intersect: true },
			scales: {
				xAxes: [{
					display: true, scaleLabel: { display: false, labelString: 'Month' }
				}],
				yAxes: [{
					display: true, ticks: {
	                   callback: function(label, index, labels) {
	                       return '$'+label/1000+'k';
	                   }
	               }, scaleLabel: { display: false, labelString: 'Amount' }
				}]
			}
        }
    }
 	if(window['chart-' + id]) {
		window['chart-' + id].data.datasets = config.data.datasets;
		window['chart-' + id].data.labels = config.data.labels;
		window['chart-' + id].update()
	} else {
		var ctx = document.getElementById(id).getContext("2d");
		window['chart-' + id] = new Chart(ctx, config);
	}
}


$(document).delegate('.js-add-tag', 'click', function(e) {
	e.preventDefault();
	tag = prompt('add a tag', '');
	id = $(e.target).closest('tr').attr('data-id')
	if(tag)
		$.post('load.php', {id:id,tag:tag}, parse_list)
	return false;
});

$(document).delegate('.js-tag', 'click', function(e) {
	tag = $(this).attr('data-tag');
	if(e.metaKey || e.shiftKey) {
		if(!confirm('delete ' + tag + '?')) return false;
		id = $(this).closest('tr').attr('data-id');
		if(!id) id = false;
		if(selected_tag == tag && !id) selected_tag = false;
		$.post('load.php', {delete:1,tag:tag,id:id?id:''}, parse_list);
	} else {
		select_tag(tag);
	}
	return false;
});

$('.js-month-selector').on('change', function() {
	month_range = $('.js-month-selector option:selected').val();
	localStorage.setItem('month_range', month_range);
	set_list();
});

$('.js-clear-source').on('click', function() {
	source = prompt('insert source to delete', '');
	$.post('load.php', {delete:1,source:source}, function(data) {
		init();
	});
});

$('.js-export').on('click', function(e) {
	e.preventDefault();
	window.location = 'data:text/json,' + JSON.stringify(list)
	return false;
});

$('.js-tag-filter').on('click', function(e) {
	e.preventDefault();
	filter = prompt('search for (regex supported)', '');
	if(filter == null){
		return
	}
	tag = prompt('set tags', '');
	if(tag == null){
		return
	}
	$.post('load.php', {filter:filter,tag:tag}, function(data) {
		init();
	});
	return false;
});

$('#js-import-csv-file').on('change', function(e) {
	var input = event.target;
	var reader = new FileReader();
	reader.onload = function(){
		$('#inputCSV').val(reader.result);
	};
	reader.readAsText(input.files[0]);
});

$('.js-import-csv').on('click', function() {
	$('#import-csv-form').removeClass('hidden');
});

$('.js-import-csv-cancel').on('click', function() {
	$('#import-csv-form').addClass('hidden');
});

$('#import-csv-form').on('submit', function(e) {
	e.preventDefault();
	$.post('load.php', {csv:$('#inputCSV').val(),source:$('#inputSource').val()}, function(data) {
		$('#import-csv-form').addClass('hidden')[0].reset();
		parse_list(data);
	});
	return false;
});