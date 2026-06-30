package app.secondrise.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import javax.net.ssl.SSLContext;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register native plugins
        registerPlugin(HealthConnectPlugin.class);

        // Enable TLS 1.2 explicitly for Android 7 and below
        try {
            SSLContext.getInstance("TLSv1.2").createSSLEngine();
            Log.d("SecondRise", "TLS 1.2 enabled");
        } catch (Exception e) {
            Log.e("SecondRise", "Error enabling TLS 1.2: " + e.getMessage());
        }
        super.onCreate(savedInstanceState);
    }
}
