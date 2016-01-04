<?php namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{

    protected $table = 'items';

    protected $fillable = ['craftable'];

    public function getCategoryAttribute($value)
    {
        $categories = explode(',', $value);
        return array_map('intval', $categories);
    }

    public function setCategoryAttribute($value)
    {
        $this->attributes['category'] = implode(',', $value);
    }
}
