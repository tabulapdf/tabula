import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;

public class WatchmanTest {
    private static String watchedLog;

    @Rule
    public TestWatcher watchman = new TestWatcher() {
        @Override
        protected void succeeded(Description description) {
            watchedLog += description + " " + "success!\n";
        }

        @Override
        protected void failed(Throwable e, Description description) {
            watchedLog += description + "\n";
        }
    };
    @Test
    public void fails(){
        fails();
    }
    @Test
    public void succeeds(){}
}
