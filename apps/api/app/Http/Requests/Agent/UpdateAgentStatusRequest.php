<?php

namespace App\Http\Requests\Agent;

use App\Enums\AgentAvailability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateAgentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'availability' => ['required', new Enum(AgentAvailability::class)],
        ];
    }
}
