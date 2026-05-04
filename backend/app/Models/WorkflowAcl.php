<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowAcl extends Model
{
    protected $table = 'workflow_acls';
    public $incrementing = false;
    protected $primaryKey = null;

    protected $fillable = ['workflow_id', 'user_id', 'permission'];

    /** @return BelongsTo<Workflow> */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /** @return BelongsTo<User> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
