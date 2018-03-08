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
		if(preg_match("/".str_replace('/', '\/', $filter)."/si",$item['title'])) {
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
	backup_list();
	$source = strtolower(trim($source));
	$list = get_list(true);

	$data = $csv;
	$json = [];
	$data = explode("\n", $data);
	
	$headers = explode(',', trim(array_shift($data)));
	//status should be the last one to align properly
	$ignore_end = 0;
	foreach($headers as $header_key => $header) {
		if($header == 'status') {
			break;
		}
	}
	$ignore_end = $header_key + 1;
	foreach($data as $line) {
		$line = trim($line);
		if(!$line) continue;
		$line = explode(',', $line);
		if($ignore_end) {
			//we don't parse the real csv, check if line-count is larger than header count and align
			$column_diff = 0;
			if(count($line) > count($headers)) {
				$column_diff = count($line) - count($headers);
			}
			array_splice($line, $ignore_end + $column_diff);
		}
		$id = array_shift($line);
		$status = 'sent';array_pop($line); //since status changes during different imports, always keep as sent
		$date = array_pop($line);
		$currency = array_pop($line);
		array_pop($line);
		array_pop($line);
		$total = array_pop($line);
		$program = array_pop($line);
		$title = preg_replace(array('/^"/', '/"$/'), '', implode(',',$line));
		$title = str_replace(array('""'), array('"'), $title);

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
	$list = $list ? array_merge($list, $json) : $json;
	
	save_list($list);
}

function save_list($list) {
	array_multisort(
		array_column($list, 'date'),  SORT_DESC,
		array_column($list, 'id'), SORT_ASC,
		$list);
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

function backup_list() {
	if(file_exists('db/db.txt'))
		file_put_contents('db/db-backup-'.date("ymd-his").'.txt', file_get_contents('db/db.txt'));
}
function get_list($json = false) {
	$str = file_exists('db/db.txt') ? file_get_contents('db/db.txt') : '';
	return $json ? json_decode($str, true) : $str;
}

function show_all() {
	header("Content-type: application/json");
	echo '{"list":';
	echo get_list();
	echo '}';
}
