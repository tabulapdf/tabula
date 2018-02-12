import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import static junit.framework.TestCase.assertTrue;

public class TestHomePage {
    @Test
    public void startWebDriver() throws InterruptedException {
        WebDriver driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        try{ //clicking all the menu tabs on the homepage
            driver.findElement(By.className("navbar-brand")).click();
            driver.findElement(By.id("upload-nav")).click();
            Thread.sleep(3000);
            driver.findElement(By.id("templates-nav")).click();
            String text_template = "My Saved Templates";
            assertTrue("Failed, couldn't find My Templates page",text_template.equals(driver.findElement(By.className("my_saved_template_title")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("about-nav")).click();
            assertTrue("Failed, About page", "About Tabula".equals(driver.findElement(By.className("about_tabula")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("help-nav")).click();
            assertTrue("Failed, couldn't find Help page", "How to Use Tabula".equals(driver.findElement(By.name("howto")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("source-code")).click();
            assertTrue("Failed, Couldn't find Tabula's GitHub Page", "Tabula".equals(driver.getPageSource().contains("Tabula")));
            driver.navigate().back();
            Thread.sleep(2000);
            driver.quit();
        }catch(Exception e){
            System.out.print(e);
        }

    }
}
