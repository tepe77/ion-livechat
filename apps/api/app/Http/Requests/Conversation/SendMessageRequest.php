<?php

namespace App\Http\Requests\Conversation;

use App\Enums\MessageType;
use App\Rules\ValidChatAttachment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', new Enum(MessageType::class)],
            'content' => ['required_without:attachments', 'nullable', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => [new ValidChatAttachment()],
        ];
    }
}
