<?php
require('fnc.php');
if(!empty($_POST['source']) && !empty($_POST['csv'])) {
	import_source($_POST['source'], $_POST['csv']);
} else if(!empty($_POST['delete']) && !empty($_POST['source'])) {
	delete_source($_POST['source']);
} else if(!empty($_POST['delete']) && isset($_POST['id']) && !empty($_POST['tag'])) {
	delete_tag($_POST['id'], $_POST['tag']);
} else if(!empty($_POST['id']) && !empty($_POST['tag'])) {
	add_tags($_POST['id'], $_POST['tag']);
} else if(!empty($_POST['filter']) && !empty($_POST['tag'])) {
	add_tags_from_filter($_POST['filter'], $_POST['tag']);
}
show_all();