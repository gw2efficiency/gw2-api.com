<?php

/**
 * Convert an array in "dot" syntax back to a multidimensional array
 *
 * @param $dot_array array
 * @return array
 */
function array_reverse_dot($dot_array)
{
    $array = [];
    foreach ($dot_array as $key => $value) {
        array_set($array, $key, $value);
    }
    return $array;
}
