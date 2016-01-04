<?php namespace App\Console;

use Carbon\Carbon;
use Log;
use Illuminate\Console\Command as IlluminateCommand;

class Command extends IlluminateCommand
{

    private $start_ms = 0;

    /**
     * Echo a info message and start a timer
     *
     * @param $string
     */
    protected function infoStart($string)
    {
        $this->start_ms = microtime(true);
        $this->info($string);
    }

    /**
     * Finish the timer and echo out a info message including the time
     *
     * @param $string
     */
    protected function infoFinish($string)
    {
        $time = microtime(true) - $this->start_ms;
        $time = number_format($time * 1000, 0, ',', '.');
        $this->info($string . ' [' . $time . 'ms]');
    }

    /**
     * Echo out a info message including the time, and log it
     *
     * @param string $string
     */
    public function info($string)
    {
        $time = Carbon::now()->toTimeString();
        parent::info('[' . $time . '] ' . $string);

        Log::info('[' . $this->name . '] ' . $string);
    }
}
