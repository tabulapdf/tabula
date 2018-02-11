import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class TestHelpPage {
    @Test
    public void startWebDriver() throws InterruptedException {
        WebDriver driver = new FirefoxDriver();
        driver.navigate().to("http://127.0.0.1:9292/");
        Assert.assertTrue("title should start with Selenium Simplified" ,
                driver.getTitle().startsWith("Tabula"));
        driver.quit();

    }
}
