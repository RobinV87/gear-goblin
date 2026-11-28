package app.geargoblin.mobile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "BackupSave")
public class BackupSavePlugin extends Plugin {
    @PluginMethod
    public void chooseDestination(PluginCall call) {
        String staged = call.getString("staged");
        String suggested = call.getString("suggested");
        if (staged == null || !staged.matches("[0-9a-f-]{36}\\.zip") ||
            suggested == null || !suggested.matches("gear-goblin-[0-9]{4}-[0-9]{2}-[0-9]{2}\\.zip") ||
            !stagedFile(staged).isFile()) {
            call.reject("Invalid backup file.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType("application/zip")
            .putExtra(Intent.EXTRA_TITLE, suggested);
        startActivityForResult(call, intent, "saveBackup");
    }

    @ActivityCallback
    private void saveBackup(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        Uri destination = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || destination == null) {
            call.resolve(new JSObject().put("saved", false));
            return;
        }

        execute(() -> {
            try (
                FileInputStream input = new FileInputStream(stagedFile(call.getString("staged")));
                OutputStream output = getContext().getContentResolver().openOutputStream(destination, "wt")
            ) {
                if (output == null) throw new IOException("Provider did not open the destination.");
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            } catch (IOException | SecurityException error) {
                call.reject("Could not write the backup to this location.");
                return;
            }
            call.resolve(new JSObject().put("saved", true));
        });
    }

    private File stagedFile(String name) {
        return new File(new File(getContext().getCacheDir(), "backups"), name);
    }
}
