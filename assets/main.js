var list = [], selected_tag = false, all_tags = {idx:{},tags:[]};
init()
function init() {
	$.get('load.php', parse_list);
}
function parse_list(data) {
	all_tags = {idx:{},tags:[]}
	$('#list').html('');
	list = data.list;
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
		hide = false;
		if(selected_tag) {
			if(tags.indexOf(selected_tag + ' ') == -1) hide = true;
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
			$('#list tr').show()
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
	$('#stats-year,#stats-company').html('');
	years = [];
	total = {amount:0,reports:0,currency:'USD'}
	programs = []
	for(key in list) {
		val = list[key]
		tags = list[key].tags.join(' ')+' ';
		if(selected_tag) {
			if(tags.indexOf(selected_tag + ' ') == -1) continue;
		}

		currency = val['currency']
		program = val['program']
		amount = parseFloat(val['amount'])
		year = val['date'].split('-')[0]

		id = year+'-'+currency;
		if(!years[id]) years[id] = {year:year,reports:0,amount:0,currency:currency}
		
		years[id].reports++
		years[id].amount += amount


		id = program;
		if(!programs[id]) programs[id] = {program:val['program'],reports:0,amount:0,currency:currency}
		
		programs[id].reports++
		programs[id].amount += amount


		total.reports++
		total.amount += amount
	}

	for(year in years) {
		val = years[year]
		avg = Math.round(parseFloat(val.amount) / val.reports)
		amount = Math.round(parseFloat(val.amount))
		row = $("<tr>")
			.append($('<td>').text(val['year']))
			.append($('<td>').text(val['reports']))
			.append($('<td>').text(amount+' '+val['currency']))
			.append($('<td>').text(avg))
		$('#stats-year').append(row);
	}

	if(typeof year !== 'undefined') {
		avg = Math.round(parseFloat(total.amount) / total.reports)
		amount = Math.round(parseFloat(total.amount))
		row = $("<tr>")
			.append($('<td>').text('Total'))
			.append($('<td>').text(total['reports']))
			.append($('<td>').text(amount+' '+total['currency']))
			.append($('<td>').text(avg))
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
			.append($('<td>').text(val['program']))
			.append($('<td>').text(val['reports']))
			.append($('<td>').text(amount+' '+val['currency']))
			.append($('<td>').text(avg))
		$('#stats-company').append(row);
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
	if(e.shiftKey) {
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
	filter = prompt('search for', '');
	tag = prompt('set tags', '')
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
	$('.js-import-csv,.js-clear-source').hide();
});
$('.js-import-csv-cancel').on('click', function() {
	$('#import-csv-form').addClass('hidden');
	$('.js-import-csv,.js-clear-source').show();
});
$('#import-csv-form').on('submit', function(e) {
	e.preventDefault();
	$.post('load.php', {csv:$('#inputCSV').val(),source:$('#inputSource').val()}, function(data) {
		$('#import-csv-form').addClass('hidden')[0].reset();
		$('.js-import-csv,.js-clear-source').show();
		parse_list(data);
	});
	return false;
});