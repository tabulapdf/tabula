import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class TestHelpPage {
    @Test
    public static void main(String[] args){
        WebDriver driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        try{
            driver.findElement(By.id("upload-nav")).click();
            Thread.sleep(3000);
            System.out.print("pressed the button!");
            driver.findElement(By.id("templates-nav")).click();
            Thread.sleep(3000);
            driver.navigate().back();
            Thread.sleep(3000);
            driver.quit();
        }catch(Exception e){
            System.out.print(e);
        }

    }
}
