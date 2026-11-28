package app.geargoblin.mobile;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.net.ssl.HttpsURLConnection;

@CapacitorPlugin(name = "AndroidUpdate")
public class AndroidUpdatePlugin extends Plugin {
    private static final String OWNER_REPO = "RobinV87/gear-goblin";
    private static final String APK_NAME = "Gear-Goblin-Android.apk";
    private static final String APK_TYPE = "application/vnd.android.package-archive";
    private static final long MAX_APK_BYTES = 100L * 1024 * 1024;
    private final AtomicBoolean downloading = new AtomicBoolean();

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        Integer build = call.getInt("build");
        if (build == null || build < 1) {
            call.reject("Invalid Android build number.");
            return;
        }

        PackageManager packages = getContext().getPackageManager();
        if (Build.VERSION.SDK_INT >= 26 && !packages.canRequestPackageInstalls()) {
            try {
                Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(settings);
                call.resolve(new JSObject().put("status", "permission"));
            } catch (ActivityNotFoundException error) {
                call.reject("Android could not open the installer permission settings.");
            }
            return;
        }

        if (!downloading.compareAndSet(false, true)) {
            call.reject("An update is already downloading.");
            return;
        }
        new Thread(() -> download(call, build), "gear-goblin-update").start();
    }

    @SuppressWarnings("deprecation")
    private void download(PluginCall call, int build) {
        File dir = new File(getContext().getCacheDir(), "updates");
        File file = new File(dir, "gear-goblin-" + build + ".apk");
        boolean installerOpened = false;
        try {
            PackageManager packages = getContext().getPackageManager();
            String packageName = getContext().getPackageName();
            PackageInfo installed = packages.getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
            if (build <= installed.versionCode) throw new IOException("This build is already installed or older.");
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Could not prepare space for the update.");
            File[] previous = dir.listFiles();
            if (previous != null) {
                for (File cached : previous) {
                    if (cached.getName().matches("gear-goblin-[0-9]+\\.apk")) cached.delete();
                }
            }
            URL url = new URL("https://github.com/" + OWNER_REPO + "/releases/download/android-build-" + build + "/" + APK_NAME);
            downloadFile(url, file);
            PackageInfo available = packages.getPackageArchiveInfo(file.getPath(), PackageManager.GET_SIGNATURES);
            if (available == null || !packageName.equals(available.packageName) || build != available.versionCode) {
                throw new IOException("The download is not the expected Gear Goblin APK.");
            }
            if (installed.signatures == null || available.signatures == null ||
                !Arrays.equals(installed.signatures, available.signatures)) {
                call.reject("This APK uses a different signing key. Export your collection before switching builds.", "SIGNER_MISMATCH");
                return;
            }
            Uri apk = FileProvider.getUriForFile(getContext(), packageName + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(apk, APK_TYPE)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(intent);
            installerOpened = true;
            call.resolve(new JSObject().put("status", "installer"));
        } catch (IOException | PackageManager.NameNotFoundException | RuntimeException error) {
            call.reject("Could not open the Android update. Check your connection or download the APK from GitHub.");
        } finally {
            if (!installerOpened) file.delete();
            downloading.set(false);
        }
    }

    private static void downloadFile(URL initialUrl, File file) throws IOException {
        URL url = initialUrl;
        for (int hop = 0; hop < 5; hop++) {
            if (!"https".equals(url.getProtocol()) || !Arrays.asList(
                "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"
            ).contains(url.getHost()) || url.getUserInfo() != null ||
                (url.getPort() != -1 && url.getPort() != 443)) {
                throw new IOException("Unexpected download location.");
            }

            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(30_000);
            try {
                int status = connection.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = connection.getHeaderField("Location");
                    if (location == null) throw new IOException("Missing download location.");
                    url = new URL(url, location);
                    continue;
                }
                if (status != 200 || connection.getContentLength() > MAX_APK_BYTES) {
                    throw new IOException("APK download unavailable.");
                }
                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(file)) {
                    byte[] buffer = new byte[64 * 1024];
                    long total = 0;
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        total += count;
                        if (total > MAX_APK_BYTES) throw new IOException("APK exceeds download limit.");
                        output.write(buffer, 0, count);
                    }
                    if (total == 0) throw new IOException("APK is empty.");
                }
                return;
            } finally {
                connection.disconnect();
            }
        }
        throw new IOException("Too many download redirects.");
    }
}
