<?php namespace App\Models;

use ArrayAccess;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use JsonSerializable;
use Redis;

class CacheItem implements ArrayAccess, Arrayable, Jsonable, JsonSerializable
{

    public $id;

    public $attributes = [];

    public static $cache_prefix = "gw2-item-";

    /**
     * Find an item in cache by id
     *
     * @param $id
     * @return $this|null
     */
    public function find($id)
    {
        $this->id = $id;
        $cache_content = Redis::get(self::prefixIdentifier($this->id));

        if (!$cache_content) {
            return null;
        }

        $this->attributes = unserialize($cache_content);

        return $this;
    }

    /**
     * Initialize and save a new item
     *
     * @param $id
     * @param $attributes
     * @return $this
     */
    public function create($id, $attributes)
    {
        $this->initialize($id, $attributes);
        $this->save();

        return $this;
    }

    /**
     * Initialize a new item
     *
     * @param $id
     * @param $attributes
     * @return $this
     */
    public function initialize($id, $attributes)
    {
        $this->id = $id;
        $this->attributes = $attributes;

        return $this;
    }

    /**
     * Create an item in cache, or update it if it already existed
     *
     * @param $id
     * @param $attributes
     * @return $this|CacheItem
     */
    public function createOrUpdate($id, $attributes)
    {
        $exists = $this->find($id);

        // Item didn't exist yet, add a new one
        if (!$exists) {
            return $this->create($id, $attributes);
        }

        $this->update($attributes);

        return $this;
    }

    /**
     * Update an item in cache
     *
     * @param $attributes
     */
    public function update($attributes)
    {
        $this->mergeAttributes($attributes);
        $this->save();
    }

    /**
     * Merge the item's attributes with the supplied ones
     *
     * @param $attributes
     */
    public function mergeAttributes($attributes)
    {
        $this->attributes = array_merge($this->attributes, $attributes);
    }

    /**
     * Save the item in cache
     */
    public function save()
    {
        $cache_content = serialize($this->attributes);
        Redis::set(self::prefixIdentifier($this->id), $cache_content);
    }

    /**
     * Prefix an identifier (or an array of identifiers) with the cache prefix
     *
     * @param $identifier int|array
     * @return array|string
     */
    public static function prefixIdentifier($identifier)
    {
        $prefix = self::$cache_prefix;

        if (!is_array($identifier)) {
            return $prefix . $identifier;
        }

        return array_map(function ($value) use ($prefix) {
            return $prefix . $value;
        }, $identifier);
    }

    /**
     * Dynamically retrieve attributes on the model.
     *
     * @param  string $key
     * @return mixed
     */
    public function __get($key)
    {
        if (array_key_exists($key, $this->attributes)) {
            return $this->attributes[$key];
        }

        return null;
    }

    /**
     * Dynamically set attributes on the model.
     *
     * @param  string $key
     * @param  mixed  $value
     * @return void
     */
    public function __set($key, $value)
    {
        $this->attributes[$key] = $value;
    }

    /**
     * Determine if the given attribute exists.
     *
     * @param  mixed $offset
     * @return bool
     */
    public function offsetExists($offset)
    {
        return isset($this->attributes[$offset]);
    }

    /**
     * Get the value for a given offset.
     *
     * @param  mixed $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        return $this->attributes[$offset];
    }

    /**
     * Set the value for a given offset.
     *
     * @param  mixed $offset
     * @param  mixed $value
     * @return void
     */
    public function offsetSet($offset, $value)
    {
        $this->attributes[$offset] = $value;
    }

    /**
     * Unset the value for a given offset.
     *
     * @param  mixed $offset
     * @return void
     */
    public function offsetUnset($offset)
    {
        unset($this->attributes[$offset]);
    }

    /**
     * Convert the model instance to an array.
     *
     * @return array
     */
    public function toArray()
    {
        return $this->attributes;
    }

    /**
     * Convert the model instance to JSON.
     *
     * @param  int $options
     * @return string
     */
    public function toJson($options = 0)
    {
        return json_encode($this->toArray(), $options);
    }

    /**
     * Convert the object into something JSON serializable.
     *
     * @return array
     */
    public function jsonSerialize()
    {
        return $this->toArray();
    }
}
