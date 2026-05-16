<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class RecipeImageUploadTest extends TestCase
{
    use RefreshDatabase;

    /** @var string[] */
    private array $createdFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->createdFiles as $path) {
            if (file_exists($path)) {
                unlink($path);
            }
        }
        parent::tearDown();
    }

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_admin_can_upload_jpeg_image(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.upload-image'), [
                'image' => UploadedFile::fake()->image('photo.jpg', 800, 600),
            ]);

        $response->assertOk()->assertJsonStructure(['url']);

        $url = $response->json('url');
        $this->assertStringStartsWith('/imagini/', $url);

        $disk = public_path(ltrim($url, '/'));
        $this->assertFileExists($disk);
        $this->createdFiles[] = $disk;
    }

    public function test_admin_can_upload_png_image(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.upload-image'), [
                'image' => UploadedFile::fake()->image('photo.png', 400, 400),
            ]);

        $response->assertOk();
        $url = $response->json('url');
        $this->assertStringEndsWith('.png', $url);
        $this->createdFiles[] = public_path(ltrim($url, '/'));
    }

    public function test_uploaded_url_is_accessible(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.upload-image'), [
                'image' => UploadedFile::fake()->image('test.jpg'),
            ]);

        $url = $response->json('url');
        // URL returned starts with /imagini/ — verifiable on disk
        $this->assertFileExists(public_path(ltrim($url, '/')));
        $this->createdFiles[] = public_path(ltrim($url, '/'));
    }

    public function test_upload_creates_imagini_folder_if_missing(): void
    {
        $dir     = public_path('imagini');
        $existed = is_dir($dir);
        $backup  = $dir . '_bak_' . getmypid();

        if ($existed) {
            rename($dir, $backup);
        }

        try {
            $response = $this->actingAs($this->admin())
                ->post(route('admin.recipes.upload-image'), [
                    'image' => UploadedFile::fake()->image('auto.jpg'),
                ]);

            $response->assertOk();
            $this->assertDirectoryExists($dir);
            $this->createdFiles[] = public_path(ltrim($response->json('url'), '/'));
        } finally {
            if ($existed && is_dir($backup)) {
                // move any files created during test into the restored dir
                foreach (glob($dir . '/*') as $f) {
                    rename($f, $backup . '/' . basename($f));
                }
                if (is_dir($dir)) {
                    rmdir($dir);
                }
                rename($backup, $dir);
            }
        }
    }

    public function test_non_admin_cannot_upload_image(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->post(route('admin.recipes.upload-image'), [
                'image' => UploadedFile::fake()->image('photo.jpg'),
            ]);

        $response->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_upload_image(): void
    {
        $response = $this->post(route('admin.recipes.upload-image'), [
            'image' => UploadedFile::fake()->image('photo.jpg'),
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_upload_requires_a_file(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.upload-image'), []);

        $response->assertSessionHasErrors('image');
    }

    public function test_upload_rejects_non_image_files(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.upload-image'), [
                'image' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            ]);

        $response->assertSessionHasErrors('image');
    }

    public function test_upload_rejects_files_over_5mb(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.upload-image'), [
                'image' => UploadedFile::fake()->image('big.jpg')->size(6000),
            ]);

        $response->assertSessionHasErrors('image');
    }
}
