<?php
function delete_source($source) {
	$source = strtolower(trim($source));
	$list = get_list(true);
	$new = [];
	foreach($list as $key => $line) {
		if($line['source'] == $source) continue;
		$new[$key] = $line;
	}
	save_list($new);
}
function add_tags($id, $tags) {
	$tags = explode(',', $tags);
	$list = get_list(true);
	foreach($tags as $tag) {
		$list[$id]['tags'][] = trim(strtolower($tag));
	}
	$list[$id]['tags'] = array_values(array_unique($list[$id]['tags']));
	$list = array_values($list);
	save_list($list);
}
function add_tags_from_filter($filter, $tags) {
	$tags = explode(',', $tags);
	$list = get_list(true);
	foreach($list as $id => $item) {
		if(strpos(strtolower($item['title']), strtolower($filter)) !== false) {
			foreach($tags as $tag) {
				$list[$id]['tags'][] = trim(strtolower($tag));
			}
			$list[$id]['tags'] = array_values(array_unique($list[$id]['tags']));
		}
	}
	
	$list = array_values($list);
	save_list($list);
}
function delete_tag($id = false, $tag) {
	$list = get_list(true);
	if($id) {
		if(isset($list[$id])) {
			foreach($list[$id]['tags'] as $tag_key => $tag_item) {
				if($tag_item === $tag) {
					unset($list[$id]['tags'][$tag_key]);
					break;
				}
			}
			$list[$id]['tags'] = array_values($list[$id]['tags']);
		}
	} else {
		foreach($list as $id => $item) {
			foreach($item['tags'] as $tag_key => $tag_item) {
				if($tag_item === $tag) {
					unset($list[$id]['tags'][$tag_key]);
					break;
				}
			}
			$list[$id]['tags'] = array_values($list[$id]['tags']);
		}
	}
	$list = array_values($list);
	save_list($list);
}
function import_source($source, $csv) {
	$source = strtolower(trim($source));
	$list = get_list(true);

	$data = $csv;
	$json = [];
	$data = explode("\n", $data);
	
	array_shift($data);
	foreach($data as $line) {
		$line = trim($line);
		if(!$line) continue;
		$line = explode(',', $line);
		$id = array_shift($line);
		$status = array_pop($line);
		$date = array_pop($line);
		$currency = array_pop($line);
		array_pop($line);
		array_pop($line);
		$total = array_pop($line);
		$program = array_pop($line);
		$title = preg_replace(array('/^"/', '/"$/'), '', implode(',',$line));
		$title = str_replace(array('""'), array('"'), $title);

		$key = $source.'-'.$id;

		$arr = [
			'id' => $id,
			'status' => $status,
			'date' => preg_replace('/ /', 'T', $date, 1),
			'amount' => $total,
			'currency' => $currency,
			'program' => $program,
			'title' => $title,
			'source' => $source,
		];
		ksort($arr);
		$key = md5(implode('-', $arr));

		$arr['tags'] = [$source];

		if(!isset($list[$key]))
			$json[$key] = $arr;
	}
	if(!$json) return; //nothing new to save.
	$list = array_merge($list, $json);
	
	save_list($list);
}

function save_list($list) {
	usort($list, function ($item1, $item2) {
	    if ($item1['date'] == $item2['date']) return 0;
	    return $item2['date'] < $item1['date'] ? -1 : 1;
	});
	//key up
	$new = [];
	foreach($list as $line) {
		$key_arr = $line;
		unset($key_arr['tags']);
		ksort($key_arr);
		$key = md5(implode('-', $key_arr));
		$new[$key] = $line;
	}
	file_put_contents('db/db.txt', json_encode($new));
}

#import_source('hackerone', file_get_contents('h.txt'));
#delete_source('hackerone');

function get_list($json = false) {
	$str = file_get_contents('db/db.txt');
	return $json ? json_decode($str, true) : $str;
}

function show_all() {
	header("Content-type: application/json");
	echo '{"list":'.get_list().'}';
}